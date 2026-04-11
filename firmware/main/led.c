#include "led.h"
#include "pinout.h"
#include "led_strip.h"
#include "esp_log.h"

static const char *TAG = "LED";
static led_strip_handle_t s_strip = NULL;

void led_init(void) {
    led_strip_config_t cfg = {
        .strip_gpio_num   = PIN_LED_DATA,
        .max_leds         = 1,
        .led_model        = LED_MODEL_WS2812,
        .color_component_format = LED_STRIP_COLOR_COMPONENT_FMT_GRB,
    };
    led_strip_rmt_config_t rmt_cfg = {
        .resolution_hz = 10 * 1000 * 1000,
    };
    ESP_ERROR_CHECK(led_strip_new_rmt_device(&cfg, &rmt_cfg, &s_strip));
    led_strip_clear(s_strip);
    ESP_LOGI(TAG, "init ok");
}

void led_set_rgb(uint8_t r, uint8_t g, uint8_t b) {
    if (!s_strip) return;
    led_strip_set_pixel(s_strip, 0, r, g, b);
    led_strip_refresh(s_strip);
}

void led_set(led_color_t color) {
    switch (color) {
        case LED_OFF:        led_set_rgb(0,   0,   0);   break;
        case LED_GREEN:      led_set_rgb(0,   40,  0);   break;
        case LED_ORANGE:     led_set_rgb(40,  20,  0);   break;
        case LED_PURPLE:     led_set_rgb(20,  0,   40);  break;
        case LED_RED:        led_set_rgb(40,  0,   0);   break;
        case LED_BLUE_PULSE: led_set_rgb(0,   0,   40);  break;
    }
}
