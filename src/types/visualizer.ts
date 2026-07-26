export type MetricStatus = 'healthy' | 'warning' | 'error' | 'neutral';

export interface TelemetryMetric {
  id: string;
  label: string;
  value: string | number;
  unit?: string;
  status?: MetricStatus;
}

export type CaptionSeverity = 'info' | 'warning' | 'error';

export interface CaptionEntry {
  id: string;
  timestamp: number; // tick or timestamp
  text: string;
  severity?: CaptionSeverity;
}
