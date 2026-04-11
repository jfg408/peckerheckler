#include "detector.h"
#include "mic.h"
#include "esp_log.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include <math.h>
#include <string.h>
#include <stdlib.h>

static const char *TAG = "DETECTOR";

/* 50 ms analysis window */
#define WINDOW_SAMPLES   (MIC_SAMPLE_RATE / 20)
/* Sliding tap-time ring buffer */
#define TAP_RING_SIZE    64

/* ---------- shared algorithm ---------------------------------------- */

typedef struct {
    uint32_t times_ms[TAP_RING_SIZE]; /* ring buffer of tap timestamps */
    int      head;                    /* next write index              */
    int      count;                   /* total taps recorded so far    */
    bool     last_above;
} tap_state_t;

static void tap_state_init(tap_state_t *s) {
    memset(s, 0, sizeof(*s));
}

/**
 * Process one window of PCM samples.  Returns true if the pattern fires.
 * @param s         Persistent tap state across windows
 * @param window    PCM samples for this window
 * @param n         Number of samples
 * @param pattern   Pattern to match
 * @param now_ms    Current time in milliseconds
 */
static bool process_window(tap_state_t *s, const int16_t *window, size_t n,
                            const pattern_t *pattern, uint32_t now_ms)
{
    /* --- RMS amplitude of this window -------------------------------- */
    int64_t sum = 0;
    for (size_t i = 0; i < n; i++) {
        sum += (int64_t)window[i] * window[i];
    }
    float rms = sqrtf((float)sum / (float)n) / 32768.0f;
    bool above = (rms > pattern->amplitude_threshold);

    /* --- Rising edge = tap ------------------------------------------- */
    if (above && !s->last_above) {
        s->times_ms[s->head] = now_ms;
        s->head = (s->head + 1) % TAP_RING_SIZE;
        s->count++;
    }
    s->last_above = above;

    /* --- Need enough taps before evaluating -------------------------- */
    if (s->count < pattern->burst_min_taps) {
        return false;
    }

    /* --- Burst rate over the last burst_min_taps taps ---------------- */
    int eval  = pattern->burst_min_taps;
    int i_new = (s->head - 1 + TAP_RING_SIZE) % TAP_RING_SIZE;
    int i_old = (s->head - eval + TAP_RING_SIZE) % TAP_RING_SIZE;

    uint32_t t_new = s->times_ms[i_new];
    uint32_t t_old = s->times_ms[i_old];
    uint32_t span_ms = t_new - t_old;

    if (span_ms == 0) return false;

    float rate = (float)(eval - 1) * 1000.0f / (float)span_ms;

    /* --- Stale burst: reset if taps are too spread out --------------- */
    if (span_ms > 3000) {
        tap_state_init(s);
        return false;
    }

    if (rate >= pattern->burst_rate_hz_min && rate <= pattern->burst_rate_hz_max) {
        ESP_LOGI(TAG, "Pattern match: %.1f Hz over %d taps", rate, eval);
        return true;
    }

    return false;
}

/* ---------- live mic version ---------------------------------------- */

void detect(const pattern_t *pattern) {
    int16_t window[WINDOW_SAMPLES];
    tap_state_t state;
    tap_state_init(&state);

    ESP_LOGI(TAG, "Listening (threshold=%.2f, rate=%.0f–%.0f Hz, min_taps=%d)",
             pattern->amplitude_threshold,
             pattern->burst_rate_hz_min,
             pattern->burst_rate_hz_max,
             pattern->burst_min_taps);

    for (;;) {
        size_t got = mic_read(window, WINDOW_SAMPLES, pdMS_TO_TICKS(200));
        if (got == 0) continue;

        uint32_t now_ms = xTaskGetTickCount() * portTICK_PERIOD_MS;

        if (process_window(&state, window, got, pattern, now_ms)) {
            ESP_LOGI(TAG, "Detection confirmed — cooling down %lu ms",
                     (unsigned long)pattern->cooldown_ms);
            vTaskDelay(pdMS_TO_TICKS(pattern->cooldown_ms));
            return;
        }
    }
}

/* ---------- buffer version (testing) --------------------------------- */

bool detect_in_buffer(const int16_t *samples, size_t count, const pattern_t *pattern) {
    tap_state_t state;
    tap_state_init(&state);

    size_t offset = 0;
    uint32_t now_ms = 0;

    while (offset + WINDOW_SAMPLES <= count) {
        bool hit = process_window(&state, samples + offset, WINDOW_SAMPLES, pattern, now_ms);
        if (hit) return true;
        offset  += WINDOW_SAMPLES;
        now_ms  += 50; /* each window is 50 ms */
    }
    return false;
}
