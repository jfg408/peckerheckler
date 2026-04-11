export interface Device {
  id: string;
  name?: string;
  is_monitoring: boolean;
  registered_at: string;
  auto_respond: boolean;
  auto_respond_action: ResponseAction;
}

export interface Incident {
  id: number;
  device_id: string;
  detected_at: string;
  confidence?: number;
  response_action?: ResponseAction | null;
  responded_at?: string;
  audio_played?: string;
}

export type ResponseAction = 'hawk' | 'eagle' | 'polar_bear' | 'banshee' | 'stream';
