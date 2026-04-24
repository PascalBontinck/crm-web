import { useEffect, useMemo, useState } from "react";
import { useMsal } from "@azure/msal-react";
import { useNavigate } from "react-router-dom";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { apiRequest } from "../authConfig";

function formatCurrency(value) {
  return new Intl.NumberFormat("nl-BE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value ?? 0);
}

function KpiCard({ title, value, subtitle }) {
  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="mt-2 text-3xl font-bold">{value}</div>
      {subtitle && <div className="mt-1 text-xs text-gray-400">{subtitle}</div>}
    </div>
  );
}

function SectionCard({ title, children }) {
  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold">{title}</h2>
      {children}
    </div>
  );
}

function getBarColor(current, previous) {
  if (previous === null || previous === undefined) return "#16a34a";
  return current >= previous ? "#16a34a" : "#dc2626";
}

function TopCustomersTable({ rows, onOpenCustomer }) {
  if (!rows || rows.length === 0) {
    return <div className="text-sm text-gray-500">Geen gegevens gevonden.</div>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="min-w-full table-fixed border-collapse text-sm">
        <colgroup>
          <col style={{ width: "90px" }} />
          <col style={{ width: "auto" }} />
          <col style={{ width: "140px" }} />
          <col style={{ width: "140px" }} />
          <col style={{ width: "140px" }} />
        </colgroup>
        <thead className="bg-gray-50">
          <tr className="text-left">
            <th className="px-3 py-2">Klantnr</th>
            <th className="px-3 py-2">Klant</th>
            <th className="px-3 py-2 text-right">Totale omzet</th>
            <th className="px-3 py-2 text-right">Omzet vertegenwoordiger</th>
            <th className="px-3 py-2 text-right">Omzet anderen</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.klantnr}
              className="cursor-pointer border-t hover:bg-gray-50"
              onClick={() => onOpenCustomer(row.klantnr)}
            >
              <td className="px-3 py-2 align-top">{row.klantnr}</td>
              <td className="px-3 py-2 break-words">{row.klantNaam}</td>
              <td className="px-3 py-2 text-right align-top">
                € {formatCurrency(row.totaleOmzet)}
              </td>
              <td className="px-3 py-2 text-right align-top text-green-700">
                € {formatCurrency(row.omzetVertegenwoordiger)}
              </td>
              <td className="px-3 py-2 text-right align-top text-orange-700">
                € {formatCurrency(row.omzetAnderen)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RankingTable({ rows, type, onOpenCustomer, titleNote }) {
  if (!rows || rows.length === 0) {
    return <div className="text-sm text-gray-500">Geen gegevens gevonden.</div>;
  }

  return (
    <div className="space-y-3">
      {titleNote && <div className="text-xs text-gray-500">{titleNote}</div>}

      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full table-fixed border-collapse text-sm">
          <colgroup>
            <col style={{ width: "90px" }} />
            <col style={{ width: "auto" }} />
            <col style={{ width: "130px" }} />
            <col style={{ width: "130px" }} />
            <col style={{ width: "130px" }} />
            <col style={{ width: "150px" }} />
            <col style={{ width: "130px" }} />
          </colgroup>
          <thead className="bg-gray-50">
            <tr className="text-left">
              <th className="px-3 py-2">Klantnr</th>
              <th className="px-3 py-2">Klant</th>
              <th className="px-3 py-2 text-right">Vorig jaar totaal</th>
              <th className="px-3 py-2 text-right">Huidig jaar totaal</th>
              <th className="px-3 py-2 text-right">Verschil totaal</th>
              <th className="px-3 py-2 text-right">Huidig jaar vertegenwoordiger</th>
              <th className="px-3 py-2 text-right">Huidig jaar anderen</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.klantnr}
                className="cursor-pointer border-t hover:bg-gray-50"
                onClick={() => onOpenCustomer(row.klantnr)}
              >
                <td className="px-3 py-2 align-top">{row.klantnr}</td>
                <td className="px-3 py-2 break-words">{row.klantNaam}</td>
                <td className="px-3 py-2 text-right align-top">
                  € {formatCurrency(row.vorigJaarTotaal)}
                </td>
                <td className="px-3 py-2 text-right align-top">
                  € {formatCurrency(row.huidigJaarTotaal)}
                </td>
                <td
                  className={`px-3 py-2 text-right align-top ${
                    type === "risers"
                      ? "text-green-700"
                      : type === "fallers"
                      ? "text-red-700"
                      : row.verschilTotaal >= 0
                      ? "text-green-700"
                      : "text-red-700"
                  }`}
                >
                  € {formatCurrency(row.verschilTotaal)}
                </td>
                <td className="px-3 py-2 text-right align-top text-green-700">
                  € {formatCurrency(row.huidigJaarVertegenwoordiger)}
                </td>
                <td className="px-3 py-2 text-right align-top text-orange-700">
                  € {formatCurrency(row.huidigJaarAnderen)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { instance, accounts } = useMsal();
  const navigate = useNavigate();

  const [summary, setSummary] = useState(null);
  const [yearlyRevenue, setYearlyRevenue] = useState([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState([]);
  const [revenueBySeller, setRevenueBySeller] = useState([]);
  const [topCustomers, setTopCustomers] = useState([]);
  const [topRisers, setTopRisers] = useState([]);
  const [topFallers, setTopFallers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [filterOptions, setFilterOptions] = useState({
    canSelectSeller: false,
    sellers: [],
    scopeType: "",
  });
  const [selectedSeller, setSelectedSeller] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [melding, setMelding] = useState("");

  const apiBase = import.meta.env.VITE_API_BASE_URL;

  const getAccessToken = async () => {
    if (!accounts || accounts.length === 0) {
      throw new Error("Geen aangemelde gebruiker gevonden.");
    }

    try {
      const tokenResponse = await instance.acquireTokenSilent({
        ...apiRequest,
        account: accounts[0],
      });
      return tokenResponse.accessToken;
    } catch {
      const tokenResponse = await instance.acquireTokenPopup({
        ...apiRequest,
        account: accounts[0],
      });
      return tokenResponse.accessToken;
    }
  };

  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const accessToken = await getAccessToken();

        const res = await fetch(`${apiBase}/dashboard/filter-options`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/json",
          },
        });

        const text = await res.text();
        let data = null;

        if (text) {
          data = JSON.parse(text);
        }

        if (!res.ok) {
          throw new Error(
            data?.details ||
              data?.innerError ||
              data?.error ||
              data?.message ||
              `Filteropties laden mislukt (status ${res.status}).`
          );
        }

        setFilterOptions({
          canSelectSeller: !!data?.canSelectSeller,
          sellers: Array.isArray(data?.sellers) ? data.sellers : [],
          scopeType: data?.scopeType || "",
        });
      } catch (err) {
        setMelding(err.message || "Filteropties laden mislukt.");
      }
    };

    loadFilterOptions();
  }, []);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setMelding("");

        const accessToken = await getAccessToken();
        const sellerQuery =
          filterOptions.canSelectSeller && selectedSeller
            ? `?seller=${encodeURIComponent(selectedSeller)}`
            : "";

        const endpoints = [
          `${apiBase}/dashboard/summary${sellerQuery}`,
          `${apiBase}/dashboard/revenue/yearly${sellerQuery}`,
          `${apiBase}/dashboard/revenue/monthly-current-year${sellerQuery}`,
          `${apiBase}/dashboard/revenue/by-seller${sellerQuery}`,
          `${apiBase}/dashboard/top-customers-current-year${sellerQuery}`,
          `${apiBase}/dashboard/top-risers-current-year${sellerQuery}`,
          `${apiBase}/dashboard/top-fallers-current-year${sellerQuery}`,
          `${apiBase}/customers`,
        ];

        const responses = await Promise.all(
          endpoints.map((url) =>
            fetch(url, {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: "application/json",
              },
            })
          )
        );

        const payloads = await Promise.all(
          responses.map(async (res) => {
            const text = await res.text();
            let data = null;

            if (text) {
              try {
                data = JSON.parse(text);
              } catch {
                throw new Error("Backend gaf geen geldige JSON terug.");
              }
            }

            if (!res.ok) {
              throw new Error(
                data?.details ||
                  data?.innerError ||
                  data?.error ||
                  data?.message ||
                  `Dashboard laden mislukt (status ${res.status}).`
              );
            }

            return data;
          })
        );

        setSummary(payloads[0]);
        setYearlyRevenue(Array.isArray(payloads[1]) ? payloads[1] : []);
        setMonthlyRevenue(Array.isArray(payloads[2]) ? payloads[2] : []);
        setRevenueBySeller(Array.isArray(payloads[3]) ? payloads[3] : []);
        setTopCustomers(Array.isArray(payloads[4]) ? payloads[4] : []);
        setTopRisers(Array.isArray(payloads[5]) ? payloads[5] : []);
        setTopFallers(Array.isArray(payloads[6]) ? payloads[6] : []);
        setCustomers(Array.isArray(payloads[7]) ? payloads[7] : []);
      } catch (err) {
        setMelding(err.message || "Dashboard laden mislukt.");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [selectedSeller, filterOptions.canSelectSeller]);

  const pieData = useMemo(() => {
    if (!summary) return [];

    return [
      { name: "Actief", value: summary.activeCustomersCount ?? 0 },
      {
        name: "Niet actief",
        value: Math.max(
          0,
          (summary.customersCount ?? 0) - (summary.activeCustomersCount ?? 0)
        ),
      },
    ];
  }, [summary]);

  const yearlyChartData = useMemo(() => {
    const sorted = [...yearlyRevenue].sort((a, b) =>
      String(a.jaar).localeCompare(String(b.jaar))
    );

    return sorted.map((item, index) => {
      const previous = index > 0 ? sorted[index - 1].omzet : null;
      return { ...item, fill: getBarColor(item.omzet, previous) };
    });
  }, [yearlyRevenue]);

  const monthlyChartData = useMemo(() => {
    const sorted = [...monthlyRevenue].sort((a, b) =>
      String(a.periode).localeCompare(String(b.periode))
    );

    return sorted.map((item, index) => {
      const previous = index > 0 ? sorted[index - 1].omzet : null;
      return { ...item, fill: getBarColor(item.omzet, previous) };
    });
  }, [monthlyRevenue]);

  const openCustomerByKlantnr = (klantnr) => {
    const match = customers.find((c) => c.klantnr === klantnr);
    if (match?.id) {
      navigate(`/customers/${match.id}`);
    }
  };

  if (loading) {
    return <div className="p-6">Dashboard laden...</div>;
  }

  if (melding) {
    return (
      <div className="p-6">
        <div className="rounded-lg bg-gray-100 px-3 py-2 text-sm">{melding}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
        </div>

        {filterOptions.canSelectSeller && (
          <div className="min-w-[260px]">
            <label className="mb-1 block text-sm font-medium text-gray-600">
              Vertegenwoordiger
            </label>
            <select
              value={selectedSeller}
              onChange={(e) => setSelectedSeller(e.target.value)}
              className="w-full rounded-lg border px-3 py-2"
            >
              <option value="ALL">Alles</option>
              {filterOptions.sellers.map((seller) => (
                <option key={seller} value={seller}>
                  {seller}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Aantal klanten" value={summary?.customersCount ?? 0} />
        <KpiCard title="Actieve klanten" value={summary?.activeCustomersCount ?? 0} />
        <KpiCard
          title="Omzet huidig jaar"
          value={`€ ${formatCurrency(summary?.revenueCurrentYear ?? 0)}`}
          subtitle="Excl. btw"
        />
        <KpiCard
          title="Omzet huidige maand"
          value={`€ ${formatCurrency(summary?.revenueCurrentMonth ?? 0)}`}
          subtitle="Excl. btw"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard title="Omzet per jaar">
          {yearlyChartData.length === 0 ? (
            <div className="text-sm text-gray-500">Geen gegevens gevonden.</div>
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={yearlyChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="jaar" />
                  <YAxis width={100} tickFormatter={(v) => `€ ${formatCurrency(v)}`} />
                  <Tooltip formatter={(v) => `€ ${formatCurrency(v)}`} />
                  <Bar dataKey="omzet">
                    {yearlyChartData.map((entry, index) => (
                      <Cell key={`year-cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </SectionCard>

        <SectionCard title="Omzet per maand huidig jaar">
          {monthlyChartData.length === 0 ? (
            <div className="text-sm text-gray-500">Geen gegevens gevonden.</div>
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="periode" />
                  <YAxis width={100} tickFormatter={(v) => `€ ${formatCurrency(v)}`} />
                  <Tooltip formatter={(v) => `€ ${formatCurrency(v)}`} />
                  <Bar dataKey="omzet">
                    {monthlyChartData.map((entry, index) => (
                      <Cell key={`month-cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </SectionCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard title="Omzet per verkoper">
          {revenueBySeller.length === 0 ? (
            <div className="text-sm text-gray-500">Geen gegevens gevonden.</div>
          ) : (
            <div className="h-[420px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={revenueBySeller}
                  margin={{ top: 10, right: 20, left: 20, bottom: 90 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="verkoper"
                    angle={-90}
                    textAnchor="end"
                    interval={0}
                    height={100}
                  />
                  <YAxis
                    width={100}
                    tickFormatter={(v) => `€ ${formatCurrency(v)}`}
                  />
                  <Tooltip formatter={(v) => `€ ${formatCurrency(v)}`} />
                  <Bar dataKey="omzet" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </SectionCard>

        <SectionCard title="Actieve vs niet-actieve klanten">
          {pieData.length === 0 ? (
            <div className="text-sm text-gray-500">Geen gegevens gevonden.</div>
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={110} label>
                    <Cell fill="#16a34a" />
                    <Cell fill="#dc2626" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </SectionCard>
      </div>

      <SectionCard title="Top 10 klanten huidig jaar">
        <TopCustomersTable rows={topCustomers} onOpenCustomer={openCustomerByKlantnr} />
      </SectionCard>

      <SectionCard title="Top 10 sterkste stijgers">
        <RankingTable
          rows={topRisers}
          type="risers"
          onOpenCustomer={openCustomerByKlantnr}
          titleNote={
            topRisers?.[0]?.periodeLabel
              ? `${new Date().getFullYear()} vs ${new Date().getFullYear() - 1} · periode ${topRisers[0].periodeLabel}`
              : ""
          }
        />
      </SectionCard>

      <SectionCard title="Top 10 sterkste dalers">
        <RankingTable
          rows={topFallers}
          type="fallers"
          onOpenCustomer={openCustomerByKlantnr}
          titleNote={
            topFallers?.[0]?.periodeLabel
              ? `${new Date().getFullYear()} vs ${new Date().getFullYear() - 1} · periode ${topFallers[0].periodeLabel}`
              : ""
          }
        />
      </SectionCard>
    </div>
  );
}