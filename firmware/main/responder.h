#pragma once

/**
 * @brief Handle a response action received from the mobile app.
 *
 * - "hawk", "eagle", "bear": fetch PCM from backend, play through speaker.
 * - "stream": connect WebSocket receiver and pipe to speaker until done.
 *
 * @param action        Action string from cloud_poll_response()
 * @param incident_id   Incident ID (required for "stream" action)
 */
void responder_handle(const char *action, int incident_id);
