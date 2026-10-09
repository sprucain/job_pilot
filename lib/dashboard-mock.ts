// Mock data for Feature 14's UI-only dashboard. Features 15-17 replace each export
// with real InsForge/PostHog data; the shapes below are what the components consume.

export type ChartPoint = {
  label: string;
  value: number;
};

export const MOCK_RESEARCH_ACTIVITY: ChartPoint[] = [
  { label: "Mon", value: 2 },
  { label: "Tue", value: 5 },
  { label: "Wed", value: 3 },
  { label: "Thu", value: 8 },
  { label: "Fri", value: 12 },
  { label: "Sat", value: 4 },
  { label: "Sun", value: 1 },
];

export const MOCK_JOBS_OVER_TIME: ChartPoint[] = [
  { label: "Mon", value: 12 },
  { label: "Tue", value: 45 },
  { label: "Wed", value: 32 },
  { label: "Thu", value: 61 },
  { label: "Fri", value: 85 },
  { label: "Sat", value: 39 },
  { label: "Sun", value: 10 },
];

export const MOCK_SCORE_DISTRIBUTION: ChartPoint[] = [
  { label: "50-60%", value: 5 },
  { label: "60-70%", value: 15 },
  { label: "70-80%", value: 45 },
  { label: "80-90%", value: 85 },
  { label: "90-100%", value: 35 },
];
