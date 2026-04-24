import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader } from "../ui/Card";

export default function CustomersTable({
  customers,
  customersLoading,
  customersError,
  searchTerm,
  setSearchTerm,
  currentUser,
  onOpenCustomerView,
}) {
  const [sortConfig, setSortConfig] = useState({ key: "id", direction: "asc" });

  const handleSort = (key) => {
    setSortConfig((current) => {
      if (current.key === key) {
        return {
          key,
          direction: current.direction === "asc" ? "desc" : "asc",
        };
      }
      return { key, direction: "asc" };
    });
  };

  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) return "↕";
    return sortConfig.direction === "asc" ? "↑" : "↓";
  };

  const filteredCustomers = useMemo(() => {
    const value = searchTerm.trim().toLowerCase();
    let result = customers;

    if (value) {
      result = customers.filter((customer) => {
        return (
          (customer.name || "").toLowerCase().includes(value) ||
          (customer.status || "").toLowerCase().includes(value) ||
          String(customer.id).includes(value)
        );
      });
    }

    return [...result].sort((a, b) => {
      if (sortConfig.key === "id") {
        return sortConfig.direction === "asc" ? a.id - b.id : b.id - a.id;
      }

      if (sortConfig.key === "name") {
        const compare = (a.name || "").localeCompare(b.name || "", "nl");
        return sortConfig.direction === "asc" ? compare : -compare;
      }

      return 0;
    });
  }, [customers, searchTerm, sortConfig]);

  return (
    <Card>
      <CardHeader
        title="Klantenoverzicht"
        subtitle={
          currentUser.role === "Sales"
            ? "Je ziet alleen jouw klanten."
            : "Je ziet alle klanten waarvoor je rechten hebt."
        }
        right={
          <div className="w-full max-w-[320px]">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Zoek op naam, status of ID..."
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm outline-none focus:border-slate-500"
            />
          </div>
        }
      />

      <CardContent>
        {customersLoading ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
            Klanten worden geladen...
          </div>
        ) : customersError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
            {customersError}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="px-3 py-3 font-medium">
                    <button
                      type="button"
                      onClick={() => handleSort("id")}
                      className="inline-flex items-center gap-2 font-medium text-slate-500 hover:text-slate-900"
                    >
                      ID <span className="text-xs">{getSortIndicator("id")}</span>
                    </button>
                  </th>

                  <th className="px-3 py-3 font-medium">
                    <button
                      type="button"
                      onClick={() => handleSort("name")}
                      className="inline-flex items-center gap-2 font-medium text-slate-500 hover:text-slate-900"
                    >
                      Naam <span className="text-xs">{getSortIndicator("name")}</span>
                    </button>
                  </th>

                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-3 py-3 font-medium">Verkoper ID</th>
                  <th className="px-3 py-3 font-medium text-right">Acties</th>
                </tr>
              </thead>

              <tbody>
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-8 text-center text-slate-500">
                      Geen klanten gevonden.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                      <td className="px-3 py-4 text-slate-700">{customer.id}</td>
                      <td className="px-3 py-4 font-medium text-slate-900">{customer.name}</td>
                      <td className="px-3 py-4 text-slate-700">{customer.status}</td>
                      <td className="px-3 py-4 text-slate-700">{customer.assignedSalesUserId ?? "-"}</td>
                      <td className="px-3 py-4">
                        <div className="flex items-center justify-end gap-3 text-lg">
                          <button title="Klantenfiche" onClick={() => onOpenCustomerView(customer, "detail")} className="transition hover:scale-110">📄</button>
                          <button title="Rapporten" onClick={() => onOpenCustomerView(customer, "reports")} className="transition hover:scale-110">📊</button>
                          <button title="Statistieken" onClick={() => onOpenCustomerView(customer, "stats")} className="transition hover:scale-110">📈</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}