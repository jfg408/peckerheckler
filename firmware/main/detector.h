#pragma once

#include "patterns.h"
#include <stdbool.h>
#include <stdint.h>
#include <stddef.h>

/**
 * @brief Block until the given audio pattern is detected from the microphone.
 *
 * Samples the mic continuously in 50 ms windows. Detects amplitude transient
 * peaks and measures their inter-tap rate. Returns only when the pattern
 * matches (rate in range AND tap count >= burst_min_taps).
 *
 * @param pattern Pattern to listen for (use &woodpeckerPattern as default).
 */
void detect(const pattern_t *pattern);

/**
 * @brief Run detection on a pre-recorded PCM buffer (for testing).
 *
 * Same algorithm as detect() but operates on caller-supplied data rather
 * than live mic input.  Returns true if the pattern is found anywhere in
 * the buffer.
 *
 * @param samples  Signed 16-bit mono PCM at MIC_SAMPLE_RATE
 * @param count    Number of samples in the buffer
 * @param pattern  Pattern to search for
 */
bool detect_in_buffer(const int16_t *samples, size_t count, const pattern_t *pattern);
