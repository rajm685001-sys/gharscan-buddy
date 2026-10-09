import type { InventoryItem } from "@/types/inventory";

export type SimpleChartData = {
  name: string;
  value: number;
  color: string;
};

export type CategoryChartData = {
  name: string;
  value: number;
  color: string;
};

export type StatusChartData = {
  name: string;
  value: number;
  color: string;
};

export type AnalyticsSummary = {
  totalItems: number;
  activeItems: number;
  totalValue: number;
  expiringCount: number;
  expiredCount: number;
  lowStockCount: number;
  finishedCount: number;
  groceryPending: number;
  groceryPurchased: number;
  mealsPlanned: number;
  mealsCooked: number;
};

export type DashboardSummary = {
  totalItems: number;
  activeItems: number;
  expiringCount: number;
  expiredCount: number;
  lowStockCount: number;
  finishedCount: number;
  groceryPending: number;
  groceryPurchased: number;
  mealsPlanned: number;
  mealsCooked: number;
};

export type DashboardAlert = {
  id: string;
  title: string;
  description: string;
  type: "expired" | "expiring" | "low_stock" | "finished";
  href: string;
};

export type DashboardWorkspaceProps = {
  familyName: string;
  familyCode: string;
  summary: DashboardSummary;
  categoryChartData: CategoryChartData[];
  statusChartData: StatusChartData[];
  expiryTimelineData: SimpleChartData[];
  urgentItems: InventoryItem[];
  alerts: DashboardAlert[];
};