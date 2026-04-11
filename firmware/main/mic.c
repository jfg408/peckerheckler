#include "mic.h"
#include "pinout.h"
#include "driver/i2s_std.h"
#include "esp_log.h"
#include <string.h>

static const char *TAG = "MIC";
static i2s_chan_handle_t s_rx_handle = NULL;

void mic_init(void) {
    i2s_chan_config_t chan_cfg = I2S_CHANNEL_DEFAULT_CONFIG(MIC_I2S_PORT, I2S_ROLE_MASTER);
    ESP_ERROR_CHECK(i2s_new_channel(&chan_cfg, NULL, &s_rx_handle));

    i2s_std_config_t std_cfg = {
        .clk_cfg  = I2S_STD_CLK_DEFAULT_CONFIG(MIC_SAMPLE_RATE),
        .slot_cfg = I2S_STD_MSB_SLOT_DEFAULT_CONFIG(I2S_DATA_BIT_WIDTH_32BIT, I2S_SLOT_MODE_MONO),
        .gpio_cfg = {
            .mclk = I2S_GPIO_UNUSED,
            .bclk = PIN_MIC_SCK,
            .ws   = PIN_MIC_WS,
            .dout = I2S_GPIO_UNUSED,
            .din  = PIN_MIC_SD,
            .invert_flags = { .mclk_inv = false, .bclk_inv = false, .ws_inv = false },
        },
    };
    ESP_ERROR_CHECK(i2s_channel_init_std_mode(s_rx_handle, &std_cfg));
    ESP_ERROR_CHECK(i2s_channel_enable(s_rx_handle));
    ESP_LOGI(TAG, "init ok (16kHz mono)");
}

void mic_deinit(void) {
    if (s_rx_handle) {
        i2s_channel_disable(s_rx_handle);
        i2s_del_channel(s_rx_handle);
        s_rx_handle = NULL;
    }
}

size_t mic_read(int16_t *buf, size_t samples, TickType_t timeout) {
    /* INMP441 outputs 24-bit in 32-bit frames; we read as 32-bit and downshift */
    static int32_t raw[512];
    size_t total = 0;

    while (total < samples) {
        size_t chunk = samples - total;
        if (chunk > 512) chunk = 512;

        size_t bytes_read = 0;
        i2s_channel_read(s_rx_handle, raw, chunk * sizeof(int32_t), &bytes_read, timeout);
        size_t got = bytes_read / sizeof(int32_t);

        for (size_t i = 0; i < got; i++) {
            buf[total + i] = (int16_t)(raw[i] >> 14);
        }
        total += got;
        if (got < chunk) break;
    }
    return total;
}
