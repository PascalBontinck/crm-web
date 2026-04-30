import { useEffect, useState } from "react";
import { useMsal } from "@azure/msal-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { apiRequest } from "../authConfig";

export default function ArtikelDashboardPage() {
  const { instance, accounts } = useMsal();
  const apiBase = import.meta.env.VITE_API_BASE_URL;

  const [data, setData] = useState(null);
  const [jaren, setJaren] = useState([]);
  const [jaar, setJaar] = useState("");

  const formatEuro = (value) =>
    Number(value || 0).toLocaleString("nl-BE", {
      style: "currency",
      currency: "EUR",
    });

  const formatAantal = (value) =>
    Number(value || 0).toLocaleString("nl-BE", {
      maximumFractionDigits: 2,
    });

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
    const result = await apiGet("/artikeldashboard/jaren");
    setJaren(result);
    if (!jaar && result.length > 0) setJaar(String(result[0]));
  };

  const loadDashboard = async () => {
    const result = await apiGet(
      `/artikeldashboard${jaar ? `?jaar=${jaar}` : ""}`
    );
    setData(result);
  };

  useEffect(() => {
    if (accounts.length > 0) loadJaren();
  }, [accounts]);

  useEffect(() => {
    if (accounts.length > 0) loadDashboard();
  }, [accounts, jaar]);

  if (!data) {
    return <div className="p-6 text-slate-500">Artikel dashboard laden...</div>;
  }

  const s = data.samenvatting;

  const Difference = ({ value, type = "euro" }) => {
    const val = Number(value || 0);

    return (
      <span>
        {val >= 0 ? "▲ " : "▼ "}
        {type === "euro" ? formatEuro(val) : formatAantal(val)}
      </span>
    );
  };

  const StatCard = ({
    title,
    current,
    forecast,
    previous,
    difference,
    higher,
    type,
  }) => (
    <div className="rounded-xl border bg-white p-5">
      <div className="text-sm text-slate-500">{title}</div>

      <div className="mt-2 text-2xl font-bold text-slate-900">
        {type === "euro" ? formatEuro(current) : formatAantal(current)}
      </div>

      {forecast !== undefined && (
        <div className="mt-1 text-sm text-slate-600">
          Prognose: {type === "euro" ? formatEuro(forecast) : formatAantal(forecast)}
        </div>
      )}

      <div className="mt-1 text-sm text-slate-500">
        Vorig jaar:{" "}
        {type === "euro" ? formatEuro(previous) : formatAantal(previous)}
      </div>

      <div
        className={`mt-2 text-sm font-semibold ${
          higher ? "text-green-600" : "text-red-600"
        }`}
      >
        <Difference value={difference} type={type} />
      </div>
    </div>
  );

  const Table = ({ title, rows = [], columns, full = false }) => (
    <div className="rounded-xl border bg-white p-5">
      <h2 className="mb-4 font-bold">{title}</h2>

      <div className="max-h-[560px] overflow-auto">
        <table className={`${full ? "min-w-[1500px]" : "w-full"} text-sm`}>
          <thead className="sticky top-0 bg-white">
            <tr className="border-b text-left">
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={`py-2 ${
                    c.align === "right" ? "text-right" : ""
                  } ${c.isOmzet ? "pl-4 border-l border-slate-200" : ""}`}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.map((row, index) => (
              <tr
                key={`${row.artnr || row.naam}-${index}`}
                className={`border-b ${
                  index % 2 === 0 ? "bg-white" : "bg-slate-50"
                }`}
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={`py-2 ${
                      c.align === "right" ? "text-right" : ""
                    } ${
                      c.isOmzet ? "pl-4 border-l border-slate-200" : ""
                    } ${c.className ? c.className(row) : ""}`}
                  >
                    {c.render ? c.render(row) : row[c.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const artikelKolom = {
    key: "artikelnaam",
    label: "Artikel",
    render: (r) => (
      <div className="max-w-[520px] whitespace-normal break-words leading-tight">
        <div className="font-medium">{r.artikelnaam}</div>
        <div className="text-xs text-slate-500">{r.artnr}</div>
      </div>
    ),
  };

  const analyseKolommen = [
    artikelKolom,

    {
      key: "aantal",
      label: `Aantal tot nu ${data.jaar}`,
      align: "right",
      render: (r) => formatAantal(r.aantal),
    },
    {
      key: "aantalPrognose",
      label: `Aantal prognose ${data.jaar}`,
      align: "right",
      render: (r) => formatAantal(r.aantalPrognose),
    },
    {
      key: "aantalVorigJaar",
      label: `Aantal ${data.vorigJaar}`,
      align: "right",
      render: (r) => formatAantal(r.aantalVorigJaar),
    },
    {
      key: "aantalVerschilPrognose",
      label: "Δ aantal prognose",
      align: "right",
      render: (r) => (
        <Difference value={r.aantalVerschilPrognose} type="aantal" />
      ),
      className: (r) =>
        Number(r.aantalVerschilPrognose || 0) >= 0
          ? "text-green-600 font-semibold"
          : "text-red-600 font-semibold",
    },

    {
      key: "omzet",
      label: `Omzet tot nu ${data.jaar}`,
      align: "right",
      isOmzet: true,
      render: (r) => formatEuro(r.omzet),
    },
    {
      key: "omzetPrognose",
      label: `Omzet prognose ${data.jaar}`,
      align: "right",
      isOmzet: true,
      render: (r) => formatEuro(r.omzetPrognose),
    },
    {
      key: "omzetVorigJaar",
      label: `Omzet ${data.vorigJaar}`,
      align: "right",
      isOmzet: true,
      render: (r) => formatEuro(r.omzetVorigJaar),
    },
    {
      key: "verschilPrognose",
      label: "Δ omzet prognose",
      align: "right",
      isOmzet: true,
      render: (r) => <Difference value={r.verschilPrognose} type="euro" />,
      className: (r) =>
        Number(r.verschilPrognose || 0) >= 0
          ? "text-green-600 font-semibold"
          : "text-red-600 font-semibold",
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Artikel dashboard
          </h1>
          <p className="text-sm text-slate-500">
            Overzicht van omzet, aantallen, prognoses, stijgers en dalers.
          </p>
        </div>

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
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title={`Omzet tot nu ${data.jaar}`}
          current={s.omzetHuidig}
          forecast={s.omzetPrognose}
          previous={s.omzetVorig}
          difference={s.omzetVerschil}
          higher={s.omzetIsHoger}
          type="euro"
        />

        <StatCard
          title={`Aantal tot nu ${data.jaar}`}
          current={s.aantalHuidig}
          forecast={s.aantalPrognose}
          previous={s.aantalVorig}
          difference={s.aantalVerschil}
          higher={s.aantalIsHoger}
          type="aantal"
        />

        <StatCard
          title="Top artikelen omzet"
          current={data.topArtikelenOmzet?.length || 0}
          previous={0}
          difference={0}
          higher={true}
          type="aantal"
        />

        <StatCard
          title="Aantal hoofdgroepen"
          current={data.topHoofdgroepen?.length || 0}
          previous={0}
          difference={0}
          higher={true}
          type="aantal"
        />
      </div>

      <div className="rounded-xl border bg-white p-5">
        <h2 className="mb-4 font-bold">Omzet per maand</h2>

        <div className="h-[380px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.omzetPerMaand}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip formatter={(v) => formatEuro(v)} />
              <Bar
                dataKey="omzet"
                shape={(props) => {
                  const { x, y, width, height, payload } = props;
                  return (
                    <rect
                      x={x}
                      y={y}
                      width={width}
                      height={height}
                      fill={payload.isHoger ? "#16a34a" : "#dc2626"}
                    />
                  );
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Table
          title="Top hoofdgroepen"
          rows={data.topHoofdgroepen}
          columns={[
            { key: "naam", label: "Hoofdgroep" },
            {
              key: "omzet",
              label: `Tot nu ${data.jaar}`,
              align: "right",
              render: (r) => formatEuro(r.omzet),
            },
            {
              key: "prognoseOmzet",
              label: `Prognose ${data.jaar}`,
              align: "right",
              render: (r) => formatEuro(r.prognoseOmzet),
              className: (r) =>
                r.isHoger ? "text-green-600 font-semibold" : "text-red-600 font-semibold",
            },
            {
              key: "omzetVorigJaar",
              label: `Omzet ${data.vorigJaar}`,
              align: "right",
              render: (r) => formatEuro(r.omzetVorigJaar),
            },
          ]}
        />

        <Table
          title="Top 10 artikelen op omzet"
          rows={data.topArtikelenOmzet}
          columns={[
            artikelKolom,
            {
              key: "omzet",
              label: "Omzet",
              align: "right",
              render: (r) => formatEuro(r.omzet),
            },
            {
              key: "aantal",
              label: "Aantal",
              align: "right",
              render: (r) => formatAantal(r.aantal),
            },
          ]}
        />
      </div>

      <div className="space-y-4">
        <Table
          title="Top 10 artikelen op aantal"
          rows={data.topArtikelenAantal}
          columns={[
            artikelKolom,
            {
              key: "aantal",
              label: "Aantal",
              align: "right",
              render: (r) => formatAantal(r.aantal),
            },
            {
              key: "omzet",
              label: "Omzet",
              align: "right",
              render: (r) => formatEuro(r.omzet),
            },
          ]}
          full
        />

        <Table
          title="Grootste dalers"
          rows={data.dalers}
          columns={analyseKolommen}
          full
        />

        <Table
          title="Grootste stijgers"
          rows={data.stijgers}
          columns={analyseKolommen}
          full
        />
      </div>
    </div>
  );
}