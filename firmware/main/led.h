#pragma once

#include <stdint.h>

typedef enum {
    LED_OFF    = 0,
    LED_GREEN,       /**< Monitoring / listening                  */
    LED_ORANGE,      /**< Detection confirmed, awaiting response  */
    LED_PURPLE,      /**< Playing deterrent / streaming audio     */
    LED_RED,         /**< Error                                   */
    LED_BLUE_PULSE,  /**< Connecting to WiFi (pulsed in task)     */
} led_color_t;

void led_init(void);
void led_set(led_color_t color);
void led_set_rgb(uint8_t r, uint8_t g, uint8_t b);
