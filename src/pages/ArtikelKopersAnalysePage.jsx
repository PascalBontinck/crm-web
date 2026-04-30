import { useEffect, useState } from "react";
import { useMsal } from "@azure/msal-react";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";
import { apiRequest } from "../authConfig";

export default function ArtikelKopersAnalysePage() {
  const { instance, accounts } = useMsal();
  const navigate = useNavigate();
  const apiBase = import.meta.env.VITE_API_BASE_URL;

  const [data, setData] = useState(null);
  const [filters, setFilters] = useState(null);
  const [jaren, setJaren] = useState([]);

  const [jaar, setJaar] = useState("");
  const [hoofdgroep, setHoofdgroep] = useState("");
  const [artikelgroep, setArtikelgroep] = useState("");
  const [deelgroep, setDeelgroep] = useState("");
  const [subgroep, setSubgroep] = useState("");
  const [zoek, setZoek] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("kopersDitJaar");

  const formatEuro = (value) =>
    Number(value || 0).toLocaleString("nl-BE", {
      style: "currency",
      currency: "EUR",
    });

  const formatAantal = (value) =>
    Number(value || 0).toLocaleString("nl-BE", {
      maximumFractionDigits: 2,
    });

  const formatDate = (value) => {
    if (!value) return "";
    return new Date(value).toLocaleDateString("nl-BE");
  };

  const getToken = async () => {
    const response = await instance.acquireTokenSilent({
      ...apiRequest,
      account: accounts[0],
    });

    return response.accessToken;
  };

  const apiGet = async (url) => {
    const token = await getToken();

    const res = await fetch(`${apiBase}${url}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error("API fout");

    return await res.json();
  };

  const loadJaren = async () => {
    const result = await apiGet("/artikelkopersanalyse/jaren");
    setJaren(result);

    if (!jaar && result.length > 0) {
      setJaar(String(result[0]));
    }
  };

  const loadFilters = async () => {
    const params = new URLSearchParams();

    if (hoofdgroep) params.append("hoofdgroep", hoofdgroep);
    if (artikelgroep) params.append("artikelgroep", artikelgroep);
    if (deelgroep) params.append("deelgroep", deelgroep);

    const result = await apiGet(
      `/artikelkopersanalyse/filters?${params.toString()}`
    );

    setFilters(result);
  };

  const loadAnalyse = async (override = null) => {
    const params = new URLSearchParams();

    const selectedJaar = override?.jaar ?? jaar;
    const selectedHoofdgroep = override?.hoofdgroep ?? hoofdgroep;
    const selectedArtikelgroep = override?.artikelgroep ?? artikelgroep;
    const selectedDeelgroep = override?.deelgroep ?? deelgroep;
    const selectedSubgroep = override?.subgroep ?? subgroep;
    const selectedZoek = override?.zoek ?? zoek;

    if (selectedJaar) params.append("jaar", selectedJaar);
    if (selectedHoofdgroep) params.append("hoofdgroep", selectedHoofdgroep);
    if (selectedArtikelgroep) params.append("artikelgroep", selectedArtikelgroep);
    if (selectedDeelgroep) params.append("deelgroep", selectedDeelgroep);
    if (selectedSubgroep) params.append("subgroep", selectedSubgroep);
    if (selectedZoek) params.append("zoek", selectedZoek);

    const result = await apiGet(`/artikelkopersanalyse?${params.toString()}`);
    setData(result);
  };

  const resetFilters = () => {
    setHoofdgroep("");
    setArtikelgroep("");
    setDeelgroep("");
    setSubgroep("");
    setZoek("");
    setSelectedCategory("kopersDitJaar");

    loadAnalyse({
      jaar,
      hoofdgroep: "",
      artikelgroep: "",
      deelgroep: "",
      subgroep: "",
      zoek: "",
    });
  };

  useEffect(() => {
    if (accounts.length > 0) {
      loadJaren();
    }
  }, [accounts]);

  useEffect(() => {
    if (accounts.length > 0) {
      loadFilters();
    }
  }, [accounts, hoofdgroep, artikelgroep, deelgroep]);

  useEffect(() => {
    if (accounts.length > 0 && jaar) {
      loadAnalyse();
    }
  }, [accounts, jaar, hoofdgroep, artikelgroep, deelgroep, subgroep]);

  const StatCard = ({ title, value, tone = "slate", category }) => {
    const color =
      tone === "green"
        ? "text-green-600"
        : tone === "red"
        ? "text-red-600"
        : tone === "orange"
        ? "text-orange-600"
        : "text-slate-900";

    const isActive = selectedCategory === category;

    return (
      <button
        type="button"
        onClick={() => category && setSelectedCategory(category)}
        className={`rounded-xl border bg-white p-5 text-left transition hover:bg-blue-50 ${
          isActive ? "border-blue-500 ring-2 ring-blue-100" : ""
        }`}
      >
        <div className="text-sm text-slate-500">{title}</div>
        <div className={`mt-2 text-3xl font-bold ${color}`}>
          {formatAantal(value)}
        </div>
      </button>
    );
  };

  const Difference = ({ value, type = "aantal" }) => {
    const val = Number(value || 0);

    return (
      <span>
        {val >= 0 ? "▲ " : "▼ "}
        {type === "euro" ? formatEuro(val) : formatAantal(val)}
      </span>
    );
  };

  const chartData = data
    ? [
        {
          naam: "Kopers",
          waarde: data.samenvatting.aantalKopersDitJaar,
          kleur: "#16a34a",
          category: "kopersDitJaar",
        },
        {
          naam: "Nieuwe",
          waarde: data.samenvatting.aantalNieuw,
          kleur: "#16a34a",
          category: "nieuweKopers",
        },
        {
          naam: "Minder",
          waarde: data.samenvatting.aantalMinder,
          kleur: "#f97316",
          category: "minderKopers",
        },
        {
          naam: "Gestopt",
          waarde: data.samenvatting.aantalGestopt,
          kleur: "#dc2626",
          category: "gestoptMetKopen",
        },
        {
          naam: "Risico",
          waarde: data.samenvatting.aantalRisico,
          kleur: "#dc2626",
          category: "risicoKopers",
        },
      ]
    : [];

  const omzetChartData = data
    ? [
        {
          naam: "Kopers",
          waarde: data.kopersDitJaar?.reduce(
            (sum, x) => sum + Number(x.omzetVerschil || 0),
            0
          ),
          category: "kopersDitJaar",
        },
        {
          naam: "Nieuwe",
          waarde: data.nieuweKopers?.reduce(
            (sum, x) => sum + Number(x.omzetHuidig || 0),
            0
          ),
          category: "nieuweKopers",
        },
        {
          naam: "Minder",
          waarde: data.minderKopers?.reduce(
            (sum, x) => sum + Number(x.omzetVerschil || 0),
            0
          ),
          category: "minderKopers",
        },
        {
          naam: "Gestopt",
          waarde:
            data.gestoptMetKopen?.reduce(
              (sum, x) => sum + Number(x.omzetVorig || 0),
              0
            ) * -1,
          category: "gestoptMetKopen",
        },
        {
          naam: "Risico",
          waarde:
            data.risicoKopers?.reduce(
              (sum, x) => sum + Number(x.omzetVorig || 0),
              0
            ) * -1,
          category: "risicoKopers",
        },
      ]
    : [];

  const selectedTitle =
    selectedCategory === "kopersDitJaar"
      ? "Wie koopt binnen deze selectie?"
      : selectedCategory === "nieuweKopers"
      ? "Nieuwe kopers"
      : selectedCategory === "minderKopers"
      ? "Wie koopt minder dan vorig jaar?"
      : selectedCategory === "gestoptMetKopen"
      ? "Wie koopt plots niets meer?"
      : "Risico: kocht vorig jaar meerdere stuks, nu niets";

  const Table = ({ title, rows = [] }) => (
    <div className="rounded-xl border bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-bold">{title}</h2>
        <div className="text-sm text-slate-500">{rows.length} klanten</div>
      </div>

      <div className="max-h-[520px] overflow-auto">
        <table className="min-w-[1050px] w-full text-sm">
          <thead className="sticky top-0 bg-white">
            <tr className="border-b text-left">
              <th className="w-[280px] py-2">Klant</th>
              <th className="py-2 text-right">Aantal {data?.jaar}</th>
              <th className="py-2 text-right">Aantal {data?.vorigJaar}</th>
              <th className="py-2 text-right">Δ aantal</th>
              <th className="py-2 text-right border-l pl-4">
                Omzet {data?.jaar}
              </th>
              <th className="py-2 text-right">Omzet {data?.vorigJaar}</th>
              <th className="py-2 text-right">Δ omzet</th>
              <th className="py-2 text-right">Laatste aankoop</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((r, index) => (
              <tr
                key={`${r.klantnr}-${index}`}
                onClick={() => navigate(`/customers/${r.klantnr}`)}
                className={`cursor-pointer border-b hover:bg-blue-50 ${
                  index % 2 === 0 ? "bg-white" : "bg-slate-50"
                }`}
              >
                <td className="py-2 pr-3">
                  <div className="font-medium whitespace-normal break-words leading-tight">
                    {r.klantnaam || "Onbekend"}
                  </div>
                  <div className="text-xs text-slate-500">{r.klantnr}</div>
                </td>

                <td className="py-2 text-right">
                  {formatAantal(r.aantalHuidig)}
                </td>
                <td className="py-2 text-right">
                  {formatAantal(r.aantalVorig)}
                </td>

                <td
                  className={`py-2 text-right font-semibold ${
                    Number(r.aantalVerschil || 0) >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  <Difference value={r.aantalVerschil} />
                </td>

                <td className="py-2 text-right border-l pl-4">
                  {formatEuro(r.omzetHuidig)}
                </td>
                <td className="py-2 text-right">
                  {formatEuro(r.omzetVorig)}
                </td>

                <td
                  className={`py-2 text-right font-semibold ${
                    Number(r.omzetVerschil || 0) >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  <Difference value={r.omzetVerschil} type="euro" />
                </td>

                <td className="py-2 text-right text-slate-500">
                  {formatDate(r.laatsteAankoop)}
                </td>
              </tr>
            ))}

            {rows.length === 0 && (
              <tr>
                <td colSpan="8" className="py-6 text-center text-slate-500">
                  Geen gegevens gevonden.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Artikel kopersanalyse
        </h1>
        <p className="text-sm text-slate-500">
          Analyseer wie welke artikelgroepen koopt, wie minder koopt en wie is
          gestopt.
        </p>
      </div>

      <div className="rounded-xl border bg-white p-5">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <select
            value={jaar}
            onChange={(e) => setJaar(e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm"
          >
            {jaren.map((j) => (
              <option key={j} value={j}>
                {j}
              </option>
            ))}
          </select>

          <select
            value={hoofdgroep}
            onChange={(e) => {
              setHoofdgroep(e.target.value);
              setArtikelgroep("");
              setDeelgroep("");
              setSubgroep("");
              setSelectedCategory("kopersDitJaar");
            }}
            className="rounded-lg border px-3 py-2 text-sm"
          >
            <option value="">Alle hoofdgroepen</option>
            {filters?.hoofdgroepen?.map((x) => (
              <option key={x.nr} value={x.nr}>
                {x.naam || x.nr}
              </option>
            ))}
          </select>

          <select
            value={artikelgroep}
            onChange={(e) => {
              setArtikelgroep(e.target.value);
              setDeelgroep("");
              setSubgroep("");
              setSelectedCategory("kopersDitJaar");
            }}
            className="rounded-lg border px-3 py-2 text-sm"
          >
            <option value="">Alle artikelgroepen</option>
            {filters?.artikelgroepen?.map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>

          <select
            value={deelgroep}
            onChange={(e) => {
              setDeelgroep(e.target.value);
              setSubgroep("");
              setSelectedCategory("kopersDitJaar");
            }}
            className="rounded-lg border px-3 py-2 text-sm"
          >
            <option value="">Alle deelgroepen</option>
            {filters?.deelgroepen?.map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>

          <select
            value={subgroep}
            onChange={(e) => {
              setSubgroep(e.target.value);
              setSelectedCategory("kopersDitJaar");
            }}
            className="rounded-lg border px-3 py-2 text-sm"
          >
            <option value="">Alle subgroepen</option>
            {filters?.subgroepen?.map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>

          <input
            value={zoek}
            onChange={(e) => setZoek(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") loadAnalyse();
            }}
            placeholder="Zoek klant of klantnr..."
            className="rounded-lg border px-3 py-2 text-sm"
          />
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={() => loadAnalyse()}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            Analyse vernieuwen
          </button>

          <button
            onClick={resetFilters}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100"
          >
            Reset filters
          </button>
        </div>
      </div>

      {data && (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
            <StatCard
              title="Kopers dit jaar"
              value={data.samenvatting.aantalKopersDitJaar}
              tone="green"
              category="kopersDitJaar"
            />
            <StatCard
              title="Gestopt met kopen"
              value={data.samenvatting.aantalGestopt}
              tone="red"
              category="gestoptMetKopen"
            />
            <StatCard
              title="Minder kopers"
              value={data.samenvatting.aantalMinder}
              tone="orange"
              category="minderKopers"
            />
            <StatCard
              title="Nieuwe kopers"
              value={data.samenvatting.aantalNieuw}
              tone="green"
              category="nieuweKopers"
            />
            <StatCard
              title="Risico klanten"
              value={data.samenvatting.aantalRisico}
              tone="red"
              category="risicoKopers"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <div className="rounded-xl border bg-white p-5">
              <h2 className="mb-4 font-bold">Aantal klanten per categorie</h2>

              <div className="h-[340px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="naam" />
                    <YAxis />
                    <Tooltip formatter={(v) => formatAantal(v)} />
                    <Bar
                      dataKey="waarde"
                      onClick={(barData) => {
                        if (barData?.category) {
                          setSelectedCategory(barData.category);
                        }
                      }}
                    >
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.kleur}
                          cursor="pointer"
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-xl border bg-white p-5">
              <h2 className="mb-4 font-bold">Omzetimpact per categorie</h2>

              <div className="h-[340px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={omzetChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="naam" />
                    <YAxis />
                    <Tooltip formatter={(v) => formatEuro(v)} />
                    <Bar
                      dataKey="waarde"
                      onClick={(barData) => {
                        if (barData?.category) {
                          setSelectedCategory(barData.category);
                        }
                      }}
                    >
                      {omzetChartData.map((entry, index) => (
                        <Cell
                          key={`omzet-cell-${index}`}
                          fill={
                            Number(entry.waarde || 0) >= 0
                              ? "#16a34a"
                              : "#dc2626"
                          }
                          cursor="pointer"
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <Table
            title={selectedTitle}
            rows={data[selectedCategory] || []}
          />
        </>
      )}
    </div>
  );
}