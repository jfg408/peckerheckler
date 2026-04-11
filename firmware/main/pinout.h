#pragma once

/**
 * @file pinout.h
 * @brief PeckerHeckler GPIO pin assignments — single source of truth.
 *
 * All pins match the Someday Box where the same hardware is reused.
 * Run `python scripts/generate_pinout_docs.py` to regenerate docs/PINOUT.md.
 */

/* --- Microphone (INMP441 I2S) --------------------------------------- */
/** @pinout GPIO 1  | MIC_SD  | INMP441 Serial Data */
#define PIN_MIC_SD      1
/** @pinout GPIO 13 | MIC_WS  | INMP441 Word Select (LR Clock) */
#define PIN_MIC_WS      13
/** @pinout GPIO 14 | MIC_SCK | INMP441 Serial Clock (Bit Clock) */
#define PIN_MIC_SCK     14

/* --- Speaker (MAX98357A I2S) ---------------------------------------- */
/** @pinout GPIO 6  | SPK_DIN  | MAX98357A Data In */
#define PIN_SPK_DIN     6
/** @pinout GPIO 4  | SPK_LRC  | MAX98357A LR Clock */
#define PIN_SPK_LRC     4
/** @pinout GPIO 5  | SPK_BCLK | MAX98357A Bit Clock */
#define PIN_SPK_BCLK    5

/* --- Status LED (WS2812 via RMT) ------------------------------------ */
/** @pinout GPIO 38 | LED_DATA | WS2812 addressable RGB LED */
#define PIN_LED_DATA    38
