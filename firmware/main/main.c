#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "nvs_flash.h"
#include "esp_log.h"

#include "pinout.h"
#include "patterns.h"
#include "detector.h"
#include "responder.h"
#include "cloud.h"
#include "mic.h"
#include "speaker.h"
#include "led.h"
#include "tests/self_test.h"

static const char *TAG = "MAIN";

/* ------------------------------------------------------------------ */
/*  Woodpecker pattern definition                                      */
/* ------------------------------------------------------------------ */

const pattern_t woodpeckerPattern = {
    .burst_rate_hz_min   = 10.0f,
    .burst_rate_hz_max   = 25.0f,
    .burst_min_taps      = 8,
    .amplitude_threshold = CONFIG_PH_AMP_THRESHOLD_PCT / 100.0f,
    .cooldown_ms         = 10000,
};

/* ------------------------------------------------------------------ */
/*  app_main                                                           */
/* ------------------------------------------------------------------ */

void app_main(void) {
    /* Flash storage for WiFi credentials */
    esp_err_t ret = nvs_flash_init();
    if (ret == ESP_ERR_NVS_NO_FREE_PAGES || ret == ESP_ERR_NVS_NEW_VERSION_FOUND) {
        ESP_ERROR_CHECK(nvs_flash_erase());
        ret = nvs_flash_init();
    }
    ESP_ERROR_CHECK(ret);

    /* Peripheral init */
    led_init();
    mic_init();
    speaker_init();

    ESP_LOGI(TAG, "PeckerHeckler firmware starting");
    ESP_LOGI(TAG, "  Device ID : %s", CONFIG_PH_DEVICE_ID);
    ESP_LOGI(TAG, "  API URL   : %s", CONFIG_PH_API_URL);

    /* WiFi */
    cloud_wifi_connect();

#ifdef CONFIG_PH_RUN_SELF_TEST
    /* Self-test: play woodpecker sound, validate mic hears it */
    if (!self_test_run()) {
        ESP_LOGE(TAG, "Self-test failed — halting");
        for (;;) vTaskDelay(portMAX_DELAY);
    }
#endif

    led_set(LED_GREEN);
    ESP_LOGI(TAG, "Monitoring started");

    /* ----------------------------------------------------------------
     * Main loop: detect → report → respond → repeat
     * ---------------------------------------------------------------- */
    for (;;) {
        /* Blocks until a woodpecker pattern is detected */
        detect(&woodpeckerPattern);

        ESP_LOGI(TAG, "Woodpecker detected!");
        led_set(LED_ORANGE);

        /* Report to backend; auto-registers device on first call */
        int incident_id = cloud_report_incident(1.0f);
        if (incident_id < 0) {
            ESP_LOGE(TAG, "Failed to report incident — resuming monitoring");
            led_set(LED_GREEN);
            continue;
        }

        /* Wait up to 30 s for a response from the mobile app */
        char action[CLOUD_ACTION_MAX_LEN] = {0};
        bool got_response = cloud_poll_response(incident_id, action, sizeof(action),
                                                30000);
        if (got_response) {
            responder_handle(action, incident_id);
        } else {
            ESP_LOGW(TAG, "No response in 30 s — resuming monitoring");
        }

        led_set(LED_GREEN);
        /* Brief pause before next listen cycle */
        vTaskDelay(pdMS_TO_TICKS(500));
    }
}
