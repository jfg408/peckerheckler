#include "cloud.h"
#include "speaker.h"
#include "led.h"
#include "esp_log.h"
#include "esp_wifi.h"
#include "esp_event.h"
#include "esp_netif.h"
#include "nvs_flash.h"
#include "esp_http_client.h"
#include "esp_websocket_client.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "freertos/event_groups.h"
#include "cJSON.h"
#include <string.h>
#include <stdlib.h>

static const char *TAG = "CLOUD";

#define WIFI_CONNECTED_BIT  BIT0
#define WIFI_FAIL_BIT       BIT1
#define WIFI_MAX_RETRIES    5

static EventGroupHandle_t s_wifi_event_group = NULL;
static int s_wifi_retries = 0;
static bool s_wifi_connected = false;

/* ------------------------------------------------------------------ */
/*  WiFi                                                               */
/* ------------------------------------------------------------------ */

static void wifi_event_handler(void *arg, esp_event_base_t base,
                                int32_t id, void *data)
{
    if (base == WIFI_EVENT && id == WIFI_EVENT_STA_START) {
        esp_wifi_connect();
    } else if (base == WIFI_EVENT && id == WIFI_EVENT_STA_DISCONNECTED) {
        s_wifi_connected = false;
        if (s_wifi_retries < WIFI_MAX_RETRIES) {
            esp_wifi_connect();
            s_wifi_retries++;
        } else {
            xEventGroupSetBits(s_wifi_event_group, WIFI_FAIL_BIT);
        }
    } else if (base == IP_EVENT && id == IP_EVENT_STA_GOT_IP) {
        s_wifi_retries  = 0;
        s_wifi_connected = true;
        xEventGroupSetBits(s_wifi_event_group, WIFI_CONNECTED_BIT);
    }
}

void cloud_wifi_connect(void) {
    led_set(LED_BLUE_PULSE);

    ESP_ERROR_CHECK(esp_netif_init());
    ESP_ERROR_CHECK(esp_event_loop_create_default());
    esp_netif_create_default_wifi_sta();

    wifi_init_config_t cfg = WIFI_INIT_CONFIG_DEFAULT();
    ESP_ERROR_CHECK(esp_wifi_init(&cfg));

    s_wifi_event_group = xEventGroupCreate();

    esp_event_handler_instance_t h_any, h_got_ip;
    ESP_ERROR_CHECK(esp_event_handler_instance_register(WIFI_EVENT, ESP_EVENT_ANY_ID,
                                                        wifi_event_handler, NULL, &h_any));
    ESP_ERROR_CHECK(esp_event_handler_instance_register(IP_EVENT, IP_EVENT_STA_GOT_IP,
                                                        wifi_event_handler, NULL, &h_got_ip));

    wifi_config_t wifi_cfg = {
        .sta = {
            .ssid     = CONFIG_PH_WIFI_SSID,
            .password = CONFIG_PH_WIFI_PASSWORD,
        },
    };
    ESP_ERROR_CHECK(esp_wifi_set_mode(WIFI_MODE_STA));
    ESP_ERROR_CHECK(esp_wifi_set_config(WIFI_IF_STA, &wifi_cfg));
    ESP_ERROR_CHECK(esp_wifi_start());

    EventBits_t bits = xEventGroupWaitBits(s_wifi_event_group,
                                           WIFI_CONNECTED_BIT | WIFI_FAIL_BIT,
                                           pdFALSE, pdFALSE,
                                           pdMS_TO_TICKS(30000));
    if (bits & WIFI_CONNECTED_BIT) {
        ESP_LOGI(TAG, "WiFi connected");
    } else {
        ESP_LOGE(TAG, "WiFi connection failed");
        led_set(LED_RED);
    }
}

bool cloud_wifi_connected(void) {
    return s_wifi_connected;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/* Simple HTTP GET → caller-owned buffer */
static esp_err_t _http_get(const char *url, uint8_t **body_out, size_t *len_out,
                            int *status_out)
{
    *body_out  = NULL;
    *len_out   = 0;
    *status_out = 0;

    esp_http_client_config_t cfg = {
        .url            = url,
        .method         = HTTP_METHOD_GET,
        .timeout_ms     = 10000,
        .buffer_size    = 4096,
        .buffer_size_tx = 512,
    };
    esp_http_client_handle_t client = esp_http_client_init(&cfg);
    esp_err_t err = esp_http_client_open(client, 0);
    if (err != ESP_OK) goto cleanup;

    int content_len = esp_http_client_fetch_headers(client);
    *status_out = esp_http_client_get_status_code(client);

    if (content_len > 0) {
        *body_out = malloc(content_len + 1);
        if (!*body_out) { err = ESP_ERR_NO_MEM; goto cleanup; }
        int read = esp_http_client_read(client, (char *)*body_out, content_len);
        if (read < 0) { err = ESP_FAIL; free(*body_out); *body_out = NULL; goto cleanup; }
        (*body_out)[read] = '\0';
        *len_out = read;
    } else if (content_len < 0) {
        /* chunked or unknown length — read until EOF */
        size_t cap = 4096, used = 0;
        *body_out = malloc(cap);
        if (!*body_out) { err = ESP_ERR_NO_MEM; goto cleanup; }
        char tmp[512];
        int r;
        while ((r = esp_http_client_read(client, tmp, sizeof(tmp))) > 0) {
            if (used + r > cap) {
                cap *= 2;
                uint8_t *nb = realloc(*body_out, cap);
                if (!nb) { err = ESP_ERR_NO_MEM; free(*body_out); *body_out = NULL; goto cleanup; }
                *body_out = nb;
            }
            memcpy(*body_out + used, tmp, r);
            used += r;
        }
        if (*body_out) (*body_out)[used] = '\0';
        *len_out = used;
    }

cleanup:
    esp_http_client_cleanup(client);
    return err;
}

/* Simple HTTP POST with JSON body → response JSON string */
static int _http_post_json(const char *url, const char *body_json,
                           char *resp_buf, size_t resp_cap)
{
    esp_http_client_config_t cfg = {
        .url         = url,
        .method      = HTTP_METHOD_POST,
        .timeout_ms  = 10000,
    };
    esp_http_client_handle_t client = esp_http_client_init(&cfg);
    esp_http_client_set_header(client, "Content-Type", "application/json");
    esp_http_client_set_post_field(client, body_json, strlen(body_json));

    esp_err_t err = esp_http_client_perform(client);
    int status = 0;
    if (err == ESP_OK) {
        status = esp_http_client_get_status_code(client);
        if (resp_buf && resp_cap > 0) {
            int len = esp_http_client_get_content_length(client);
            if (len > 0 && len < (int)resp_cap) {
                esp_http_client_read(client, resp_buf, len);
                resp_buf[len] = '\0';
            }
        }
    }
    esp_http_client_cleanup(client);
    return status;
}

/* ------------------------------------------------------------------ */
/*  Incidents                                                          */
/* ------------------------------------------------------------------ */

int cloud_report_incident(float confidence) {
    char url[128];
    snprintf(url, sizeof(url), "%s/incidents", CONFIG_PH_API_URL);

    char body[64];
    snprintf(body, sizeof(body),
             "{\"device_id\":\"%s\",\"confidence\":%.2f}",
             CONFIG_PH_DEVICE_ID, confidence);

    char resp[256] = {0};
    int status = _http_post_json(url, body, resp, sizeof(resp));
    if (status != 201) {
        ESP_LOGE(TAG, "POST /incidents → %d", status);
        return -1;
    }

    cJSON *j = cJSON_Parse(resp);
    int id = -1;
    if (j) {
        cJSON *jid = cJSON_GetObjectItem(j, "id");
        if (jid) id = jid->valueint;
        cJSON_Delete(j);
    }
    ESP_LOGI(TAG, "Incident created: id=%d", id);
    return id;
}

bool cloud_poll_response(int incident_id, char *action_out, size_t action_len,
                         uint32_t timeout_ms)
{
    char url[128];
    snprintf(url, sizeof(url), "%s/incidents/%d/response", CONFIG_PH_API_URL, incident_id);

    uint32_t elapsed = 0;
    const uint32_t interval = 2000;

    while (elapsed < timeout_ms) {
        uint8_t *body = NULL;
        size_t   len  = 0;
        int      status = 0;
        _http_get(url, &body, &len, &status);

        if (status == 200 && body) {
            cJSON *j = cJSON_Parse((char *)body);
            free(body);
            if (j) {
                cJSON *act = cJSON_GetObjectItem(j, "action");
                if (act && act->valuestring) {
                    strncpy(action_out, act->valuestring, action_len - 1);
                    action_out[action_len - 1] = '\0';
                    cJSON_Delete(j);
                    ESP_LOGI(TAG, "Response received: %s", action_out);
                    return true;
                }
                cJSON_Delete(j);
            }
        } else {
            if (body) free(body);
        }

        vTaskDelay(pdMS_TO_TICKS(interval));
        elapsed += interval;
    }

    ESP_LOGW(TAG, "Poll timed out after %lu ms", (unsigned long)timeout_ms);
    return false;
}

/* ------------------------------------------------------------------ */
/*  Audio fetch                                                        */
/* ------------------------------------------------------------------ */

bool cloud_fetch_audio(const char *sound_name, int16_t **pcm_out, size_t *count_out) {
    char url[128];
    snprintf(url, sizeof(url), "%s/audio/%s", CONFIG_PH_API_URL, sound_name);

    uint8_t *body = NULL;
    size_t   len  = 0;
    int      status = 0;
    esp_err_t err = _http_get(url, &body, &len, &status);

    if (err != ESP_OK || status != 200 || !body || len == 0) {
        ESP_LOGE(TAG, "GET /audio/%s → %d (err=%d)", sound_name, status, err);
        if (body) free(body);
        return false;
    }

    *pcm_out   = (int16_t *)body;   /* raw s16le */
    *count_out = len / sizeof(int16_t);
    ESP_LOGI(TAG, "Fetched %s: %zu samples", sound_name, *count_out);
    return true;
}

/* ------------------------------------------------------------------ */
/*  Audio streaming (WebSocket receiver)                               */
/* ------------------------------------------------------------------ */

static void ws_data_handler(void *handler_arg,
                             esp_event_base_t base,
                             int32_t event_id,
                             void *event_data)
{
    esp_websocket_event_data_t *d = (esp_websocket_event_data_t *)event_data;
    if (event_id == WEBSOCKET_EVENT_DATA &&
        d->op_code == 2 /* binary */ &&
        d->data_len > 0)
    {
        speaker_play_pcm((const int16_t *)d->data_ptr, d->data_len / sizeof(int16_t));
    }
}

void cloud_receive_stream(int incident_id) {
    char uri[192];
    /* Replace http:// with ws:// */
    const char *api = CONFIG_PH_API_URL;
    if (strncmp(api, "http://", 7) == 0) {
        snprintf(uri, sizeof(uri), "ws://%s/stream/%d?role=receiver", api + 7, incident_id);
    } else if (strncmp(api, "https://", 8) == 0) {
        snprintf(uri, sizeof(uri), "wss://%s/stream/%d?role=receiver", api + 8, incident_id);
    } else {
        snprintf(uri, sizeof(uri), "ws://%s/stream/%d?role=receiver", api, incident_id);
    }

    esp_websocket_client_config_t ws_cfg = {
        .uri            = uri,
        .reconnect_timeout_ms = 0,
        .network_timeout_ms   = 30000,
    };
    esp_websocket_client_handle_t client = esp_websocket_client_init(&ws_cfg);
    esp_websocket_register_events(client, WEBSOCKET_EVENT_ANY, ws_data_handler, NULL);
    esp_websocket_client_start(client);

    ESP_LOGI(TAG, "Streaming from %s", uri);

    /* Block until server closes or disconnects */
    while (esp_websocket_client_is_connected(client)) {
        vTaskDelay(pdMS_TO_TICKS(200));
    }

    esp_websocket_client_stop(client);
    esp_websocket_client_destroy(client);
    ESP_LOGI(TAG, "Stream ended");
}
