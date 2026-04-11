#include "speaker.h"
#include "pinout.h"
#include "driver/i2s_std.h"
#include "esp_log.h"
#include <math.h>
#include <string.h>

static const char *TAG = "SPEAKER";
static i2s_chan_handle_t s_tx_handle = NULL;

void speaker_init(void) {
    i2s_chan_config_t chan_cfg = I2S_CHANNEL_DEFAULT_CONFIG(SPK_I2S_PORT, I2S_ROLE_MASTER);
    ESP_ERROR_CHECK(i2s_new_channel(&chan_cfg, &s_tx_handle, NULL));

    i2s_std_config_t std_cfg = {
        .clk_cfg  = I2S_STD_CLK_DEFAULT_CONFIG(SPK_SAMPLE_RATE),
        .slot_cfg = I2S_STD_MSB_SLOT_DEFAULT_CONFIG(I2S_DATA_BIT_WIDTH_16BIT, I2S_SLOT_MODE_MONO),
        .gpio_cfg = {
            .mclk = I2S_GPIO_UNUSED,
            .bclk = PIN_SPK_BCLK,
            .ws   = PIN_SPK_LRC,
            .dout = PIN_SPK_DIN,
            .din  = I2S_GPIO_UNUSED,
            .invert_flags = { .mclk_inv = false, .bclk_inv = false, .ws_inv = false },
        },
    };
    ESP_ERROR_CHECK(i2s_channel_init_std_mode(s_tx_handle, &std_cfg));
    ESP_ERROR_CHECK(i2s_channel_enable(s_tx_handle));
    ESP_LOGI(TAG, "init ok (16kHz mono)");
}

void speaker_deinit(void) {
    if (s_tx_handle) {
        i2s_channel_disable(s_tx_handle);
        i2s_del_channel(s_tx_handle);
        s_tx_handle = NULL;
    }
}

void speaker_play_pcm(const int16_t *samples, size_t count) {
    size_t bytes_written = 0;
    i2s_channel_write(s_tx_handle, samples, count * sizeof(int16_t),
                      &bytes_written, portMAX_DELAY);
}

void speaker_play_tone(int hz, int ms) {
    const int samples = SPK_SAMPLE_RATE * ms / 1000;
    int16_t *buf = malloc(samples * sizeof(int16_t));
    if (!buf) return;

    for (int i = 0; i < samples; i++) {
        buf[i] = (int16_t)(16000.0f * sinf(2.0f * M_PI * hz * i / SPK_SAMPLE_RATE));
    }
    speaker_play_pcm(buf, samples);
    free(buf);
}
