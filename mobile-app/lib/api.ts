import { Device, Incident, ResponseAction } from '../types';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';
export const DEVICE_ID = process.env.EXPO_PUBLIC_DEVICE_ID ?? 'ph-000000000000';

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`);
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}`);
  return res.json();
}

async function post(path: string, body?: unknown): Promise<Response> {
  return fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
}

export const api = {
  getDevice: () => get<Device>(`/devices/${DEVICE_ID}`),

  controlDevice: (action: 'start' | 'stop') =>
    post(`/devices/${DEVICE_ID}/control`, { action }),

  getIncidents: () => get<Incident[]>(`/incidents?device_id=${DEVICE_ID}`),

  getIncident: (id: number) => get<Incident>(`/incidents/${id}`),

  respondToIncident: (id: number, action: ResponseAction) =>
    post(`/incidents/${id}/respond`, { action }),
};

/** Build WebSocket URI for the streaming endpoint. */
export function streamUri(incidentId: number, role: 'sender' | 'receiver'): string {
  const base = API_URL.replace(/^http/, 'ws');
  return `${base}/stream/${incidentId}?role=${role}`;
}
