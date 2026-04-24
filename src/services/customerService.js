import { apiGet, apiPost } from "./api";

export async function getCustomers(token) {
  return apiGet("/customers", token);
}

export async function sendCustomerNote(customerId, note, token) {
  return apiPost(`/customers/${customerId}/note`, { note }, token);
}

export async function getCustomerMonthlyRevenue(customerId, token) {
  return apiGet(`/customers/${customerId}/revenue/monthly`, token);
}

export async function getCustomerYearlyRevenue(customerId, token) {
  return apiGet(`/customers/${customerId}/revenue/yearly`, token);
}