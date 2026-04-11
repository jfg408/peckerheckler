#pragma once

#include <stdbool.h>

/**
 * @brief Full hardware self-test.
 *
 * 1. Plays the embedded woodpecker sound through the speaker.
 * 2. Simultaneously records from the microphone.
 * 3. Runs the detection algorithm against the recorded audio.
 * 4. Returns true only if detection fires — confirming the speaker
 *    and mic are both working and the detector is calibrated.
 *
 * LED feedback:
 *   Orange  → test running
 *   Green   → PASS
 *   Red     → FAIL
 *
 * Prints results to serial (ESP_LOG).
 */
bool self_test_run(void);
