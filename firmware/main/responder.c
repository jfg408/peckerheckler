#include "responder.h"
#include "cloud.h"
#include "speaker.h"
#include "led.h"
#include "esp_log.h"
#include <stdlib.h>
#include <string.h>

static const char *TAG = "RESPONDER";

void responder_handle(const char *action, int incident_id) {
    led_set(LED_PURPLE);
    ESP_LOGI(TAG, "Responding: %s", action);

    if (strcmp(action, "stream") == 0) {
        cloud_receive_stream(incident_id);
    } else {
        /* hawk / eagle / bear */
        int16_t *pcm   = NULL;
        size_t   count = 0;
        if (cloud_fetch_audio(action, &pcm, &count)) {
            speaker_play_pcm(pcm, count);
            free(pcm);
        } else {
            ESP_LOGE(TAG, "Failed to fetch audio for: %s", action);
            /* Fallback: play an audible beep so something happens */
            speaker_play_tone(880, 500);
        }
    }

    led_set(LED_GREEN);
}
