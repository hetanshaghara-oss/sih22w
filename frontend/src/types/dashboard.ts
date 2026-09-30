export interface DashboardSummary {
  total_instruments: number;
  active_instruments: number;
  tests_in_progress: number;
  completed_tests: number;
  tests_pending_review: number;
  pass_count: number;
  fail_count: number;
  reports_generated: number;
}

export interface ActivityItem {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  status?: string;
  badge_variant?: string;
}

export interface DashboardData {
  summary: DashboardSummary;
  recent_activity: ActivityItem[];
}
