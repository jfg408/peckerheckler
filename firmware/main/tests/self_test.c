#include "self_test.h"
#include "../mic.h"
#include "../speaker.h"
#include "../led.h"
#include "../detector.h"
#include "../patterns.h"
#include "esp_log.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include <stdlib.h>
#include <string.h>

static const char *TAG = "SELF_TEST";

/*
 * woodpecker_test.pcm is embedded at build time via CMakeLists.txt:
 *   target_add_binary_data(peckerheckler.elf
 *       "../../test_data/woodpecker_test.pcm" BINARY)
 *
 * The linker exposes these symbols:
 */
extern const uint8_t woodpecker_test_pcm_start[] asm("_binary_woodpecker_test_pcm_start");
extern const uint8_t woodpecker_test_pcm_end[]   asm("_binary_woodpecker_test_pcm_end");

/* How long to record (ms). Matches the embedded clip length (5 s). */
#define RECORD_MS   5200
#define SAMPLE_RATE 16000

bool self_test_run(void) {
    led_set(LED_ORANGE);
    ESP_LOGI(TAG, "=== Self-test START ===");

    /* ----------------------------------------------------------------
     * 1. Allocate recording buffer (5.2 s @ 16 kHz)
     * ---------------------------------------------------------------- */
    size_t rec_samples = (size_t)(SAMPLE_RATE) * RECORD_MS / 1000;
    int16_t *rec_buf   = malloc(rec_samples * sizeof(int16_t));
    if (!rec_buf) {
        ESP_LOGE(TAG, "FAIL: malloc(%zu) failed", rec_samples * sizeof(int16_t));
        led_set(LED_RED);
        return false;
    }
    memset(rec_buf, 0, rec_samples * sizeof(int16_t));

    /* ----------------------------------------------------------------
     * 2. Play woodpecker PCM through speaker while recording from mic.
     *    Both I2S instances run concurrently on separate ports.
     * ---------------------------------------------------------------- */
    const int16_t *play_samples = (const int16_t *)woodpecker_test_pcm_start;
    size_t play_count = (woodpecker_test_pcm_end - woodpecker_test_pcm_start)
                        / sizeof(int16_t);

    ESP_LOGI(TAG, "Playing %zu samples (%.1f s) of woodpecker audio",
             play_count, (float)play_count / SAMPLE_RATE);

    /* Launch playback in a task so recording runs simultaneously */
    typedef struct { const int16_t *s; size_t n; } play_args_t;
    static play_args_t pa;
    pa.s = play_samples;
    pa.n = play_count;

    TaskHandle_t play_task = NULL;
    xTaskCreate(
        [](void *arg) {
            play_args_t *a = (play_args_t *)arg;
            speaker_play_pcm(a->s, a->n);
            vTaskDelete(NULL);
        },
        "play_wp", 4096, &pa, 5, &play_task
    );

    /* Record for RECORD_MS */
    size_t got = mic_read(rec_buf, rec_samples, pdMS_TO_TICKS(RECORD_MS + 500));
    ESP_LOGI(TAG, "Recorded %zu samples", got);

    /* Wait for playback task to finish (it should by now) */
    vTaskDelay(pdMS_TO_TICKS(200));

    /* ----------------------------------------------------------------
     * 3. Run the detector on the recorded buffer
     * ---------------------------------------------------------------- */

    /* Use a slightly relaxed pattern to account for room acoustics:
       lower amplitude threshold, same rate range */
    pattern_t test_pattern = woodpeckerPattern;
    test_pattern.amplitude_threshold *= 0.5f;   /* easier to trigger */
    test_pattern.burst_min_taps       = 5;       /* fewer taps needed */

    ESP_LOGI(TAG, "Running detector on recorded audio...");
    bool detected = detect_in_buffer(rec_buf, got, &test_pattern);
    free(rec_buf);

    /* ----------------------------------------------------------------
     * 4. Report result
     * ---------------------------------------------------------------- */
    if (detected) {
        ESP_LOGI(TAG, "=== Self-test PASS: woodpecker pattern detected ===");
        led_set(LED_GREEN);
        speaker_play_tone(1000, 100);
        vTaskDelay(pdMS_TO_TICKS(100));
        speaker_play_tone(1500, 100);
        return true;
    } else {
        ESP_LOGE(TAG, "=== Self-test FAIL: pattern NOT detected in mic recording ===");
        ESP_LOGE(TAG, "  Check: speaker volume, mic placement, wiring on pins 1/4/5/6/13/14");
        led_set(LED_RED);
        speaker_play_tone(400, 500);
        return false;
    }
}
