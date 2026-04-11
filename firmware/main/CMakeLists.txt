idf_component_register(
    SRCS
        "main.c"
        "mic.c"
        "speaker.c"
        "led.c"
        "detector.c"
        "responder.c"
        "cloud.c"
        "tests/self_test.c"
    INCLUDE_DIRS
        "."
    REQUIRES
        driver
        led_strip
        esp_wifi
        esp_event
        esp_netif
        nvs_flash
        esp_timer
        esp_http_client
        esp_websocket_client
        json
)

# Embed the woodpecker test PCM as a binary blob in flash.
# Accessible in C via _binary_woodpecker_test_pcm_start / _end symbols.
target_add_binary_data(${COMPONENT_LIB}
    "${CMAKE_CURRENT_SOURCE_DIR}/../test_data/woodpecker_test.pcm"
    BINARY
)
