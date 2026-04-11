export interface Device {
  id: string;
  name?: string;
  is_monitoring: boolean;
  registered_at: string;
}

export interface Incident {
  id: number;
  device_id: string;
  detected_at: string;
  confidence?: number;
  response_action?: 'hawk' | 'eagle' | 'polar_bear' | 'stream' | null;
  responded_at?: string;
  audio_played?: string;
}

export type ResponseAction = 'hawk' | 'eagle' | 'polar_bear' | 'stream';
