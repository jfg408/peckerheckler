#pragma once

#include <stdint.h>
#include <stddef.h>
#include "freertos/FreeRTOS.h"

#define MIC_SAMPLE_RATE  16000
#define MIC_I2S_PORT     0   /* I2S_NUM_0 */

/** Initialise the INMP441 I2S receiver. */
void mic_init(void);

/** Tear down the I2S receiver and free resources. */
void mic_deinit(void);

/**
 * @brief Read PCM samples from the microphone.
 * @param buf     Output buffer (int16_t, mono)
 * @param samples Number of samples to read
 * @param timeout FreeRTOS ticks to wait
 * @return Samples actually read
 */
size_t mic_read(int16_t *buf, size_t samples, TickType_t timeout);
