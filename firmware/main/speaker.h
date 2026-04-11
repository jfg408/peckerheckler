#pragma once

#include <stdint.h>
#include <stddef.h>

#define SPK_SAMPLE_RATE  16000
#define SPK_I2S_PORT     1   /* I2S_NUM_1 */

/** Initialise the MAX98357A I2S transmitter. */
void speaker_init(void);

/** Tear down the I2S transmitter and free resources. */
void speaker_deinit(void);

/**
 * @brief Play a buffer of 16-bit mono PCM samples at 16 kHz.
 * @param samples Pointer to signed 16-bit PCM data
 * @param count   Number of samples
 */
void speaker_play_pcm(const int16_t *samples, size_t count);

/**
 * @brief Play a single sine-wave tone.
 * @param hz Duration frequency in Hz
 * @param ms Duration in milliseconds
 */
void speaker_play_tone(int hz, int ms);
