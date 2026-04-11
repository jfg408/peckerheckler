#pragma once

#include <stdint.h>

/**
 * @brief Describes an audio burst pattern to detect.
 *
 * The detection engine looks for rapid transient peaks whose inter-tap
 * rate falls within [burst_rate_hz_min, burst_rate_hz_max] and where at
 * least burst_min_taps have occurred before declaring a match.
 */
typedef struct {
    float    burst_rate_hz_min;   /**< Minimum tap rate (Hz) within a burst */
    float    burst_rate_hz_max;   /**< Maximum tap rate (Hz) within a burst  */
    int      burst_min_taps;      /**< Taps required to confirm detection     */
    float    amplitude_threshold; /**< Normalized RMS threshold (0.0 – 1.0)  */
    uint32_t cooldown_ms;         /**< Lockout after detection (ms)           */
} pattern_t;

/**
 * @brief Default woodpecker drumming pattern.
 *
 * Woodpeckers drum at 10–25 taps/sec in bursts of 10–30 taps.
 * Values are tunable via Kconfig (CONFIG_PH_AMP_THRESHOLD).
 */
extern const pattern_t woodpeckerPattern;
