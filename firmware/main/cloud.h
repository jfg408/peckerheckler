#pragma once

#include <stdbool.h>
#include <stdint.h>
#include <stddef.h>

#define CLOUD_ACTION_MAX_LEN  16

/**
 * @brief Connect to WiFi using credentials from Kconfig / NVS.
 *        Blocks until connected or times out. Shows blue LED pulse.
 */
void cloud_wifi_connect(void);

/** @return true if WiFi is currently connected. */
bool cloud_wifi_connected(void);

/**
 * @brief Report a woodpecker detection to the backend.
 * @param confidence  Detection confidence 0.0–1.0
 * @return Incident ID assigned by the backend, or -1 on failure.
 */
int cloud_report_incident(float confidence);

/**
 * @brief Poll the backend for a response to an incident.
 *
 * Polls GET /incidents/{id}/response every 2 s until a response arrives
 * or timeout_ms elapses.
 *
 * @param incident_id   ID returned by cloud_report_incident()
 * @param action_out    Buffer to receive the action string (e.g. "hawk")
 * @param action_len    Size of action_out buffer
 * @param timeout_ms    Maximum time to wait
 * @return true if a response was received, false if timed out.
 */
bool cloud_poll_response(int incident_id, char *action_out, size_t action_len,
                         uint32_t timeout_ms);

/**
 * @brief Fetch a deterrent sound as raw PCM from the backend.
 *
 * Caller must free *pcm_out.
 *
 * @param sound_name  "hawk", "eagle", or "bear"
 * @param pcm_out     Receives malloc'd buffer of int16_t samples
 * @param count_out   Receives number of samples
 * @return true on success.
 */
bool cloud_fetch_audio(const char *sound_name, int16_t **pcm_out, size_t *count_out);

/**
 * @brief Connect to the streaming WebSocket and pipe received PCM to the
 *        speaker until the stream ends.
 *
 * Blocks until the stream is closed by the sender (mobile app) or an
 * error occurs.
 *
 * @param incident_id  Incident whose stream to join as receiver.
 */
void cloud_receive_stream(int incident_id);
