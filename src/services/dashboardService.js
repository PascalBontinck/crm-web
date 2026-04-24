import { apiGet } from "./api";

export async function getDashboardSummary(token) {
  return apiGet("/dashboard/summary", token);
}

export async function getMonthlyRevenue(token) {
  return apiGet("/dashboard/revenue/monthly", token);
}

export async function getYearlyRevenue(token) {
  return apiGet("/dashboard/revenue/yearly", token);
}