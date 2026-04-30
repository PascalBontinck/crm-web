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

export default function ArtikelBeheerPage() {
  const { instance, accounts } = useMsal();
  const apiBase = import.meta.env.VITE_API_BASE_URL;

  const [artikelen, setArtikelen] = useState([]);
  const [filters, setFilters] = useState(null);

  const [zoek, setZoek] = useState("");
  const [hoofdgroep, setHoofdgroep] = useState("");
  const [artikelgroep, setArtikelgroep] = useState("");
  const [deelgroep, setDeelgroep] = useState("");
  const [subgroep, setSubgroep] = useState("");

  const [selectedArtikel, setSelectedArtikel] = useState(null);
  const [perJaar, setPerJaar] = useState([]);
  const [perMaand, setPerMaand] = useState([]);
  const [klanten, setKlanten] = useState([]);
  const [klantJaren, setKlantJaren] = useState([]);
  const [bestVerkocht, setBestVerkocht] = useState([]);
  const [groepOmzet, setGroepOmzet] = useState([]);
  const [jaren, setJaren] = useState([]);
  const [jaar, setJaar] = useState("");

  const formatEuro = (value) =>
    Number(value || 0).toLocaleString("nl-BE", {
      style: "currency",
      currency: "EUR",
    });

  const formatAantal = (value) =>
    Number(value || 0).toLocaleString("nl-BE", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });

  const isHogerOfGelijk = (data, index, veld = "omzet") => {
    if (index === 0) return true;

    const huidig = Number(data[index]?.[veld] || 0);
    const vorig = Number(data[index - 1]?.[veld] || 0);

    return huidig >= vorig;
  };

  const getBarColor = (data, index, veld = "omzet") =>
    isHogerOfGelijk(data, index, veld) ? "#16a34a" : "#dc2626";    

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
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) throw new Error("API fout");

    return await res.json();
  };

  const loadFilters = async () => {
    const params = new URLSearchParams();

    if (hoofdgroep) params.append("hoofdgroep", hoofdgroep);
    if (artikelgroep) params.append("artikelgroep", artikelgroep);
    if (deelgroep) params.append("deelgroep", deelgroep);

    const data = await apiGet(`/artikelbeheer/filters?${params.toString()}`);
    setFilters(data);
  };

  const loadJaren = async () => {
    const data = await apiGet("/artikelbeheer/jaren");
    setJaren(data);
  };

  const loadArtikelen = async () => {
    const params = new URLSearchParams();

    if (zoek) params.append("zoek", zoek);
    if (hoofdgroep) params.append("hoofdgroep", hoofdgroep);
    if (artikelgroep) params.append("artikelgroep", artikelgroep);
    if (deelgroep) params.append("deelgroep", deelgroep);
    if (subgroep) params.append("subgroep", subgroep);

    const data = await apiGet(`/artikelbeheer/artikelen?${params.toString()}`);
    setArtikelen(data);
  };

  const loadDashboardData = async () => {
    const best = await apiGet("/artikelbeheer/best-verkocht?take=25");
    const groep = await apiGet(
      `/artikelbeheer/omzet-per-groep${jaar ? `?jaar=${jaar}` : ""}`
    );

    setBestVerkocht(best);
    setGroepOmzet(groep);
  };

  const openArtikel = async (artikel) => {
    setSelectedArtikel(artikel);

    const [jaarData, maandData, klantData] = await Promise.all([
      apiGet(`/artikelbeheer/artikel/${encodeURIComponent(artikel.artnr)}/per-jaar`),
      apiGet(`/artikelbeheer/artikel/${encodeURIComponent(artikel.artnr)}/per-maand`),
      apiGet(`/artikelbeheer/artikel/${encodeURIComponent(artikel.artnr)}/klanten`),
    ]);

    setPerJaar(jaarData);
    setPerMaand(
      maandData.map((x) => ({
        ...x,
        label: `${x.maand}/${x.jaar}`,
      }))
    );
    setKlantJaren(klantData.jaren || []);
    setKlanten(klantData.klanten || []);
  };

  useEffect(() => {
    if (accounts.length > 0) {
      loadFilters();
      loadJaren();
      loadArtikelen();
    }
  }, [accounts, hoofdgroep, artikelgroep, deelgroep]);

  useEffect(() => {
    if (accounts.length > 0) {
      loadDashboardData();
    }
  }, [accounts, jaar]);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Artikelbeheer</h1>
        <p className="text-sm text-gray-500">
          Analyse van artikelen, omzet, verkochte eenheden en klanten.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="rounded-xl border bg-white p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-bold">Omzet per groep</h2>

            <div className="flex gap-2">
              <select
                value={jaar}
                onChange={(e) => setJaar(e.target.value)}
                className="rounded-lg border px-3 py-2 text-sm"
              >
                <option value="">Huidig jaar</option>
                {jaren.map((j) => (
                  <option key={j} value={j}>
                    {j}
                  </option>
                ))}
              </select>

            </div>
          </div>

          <div className="h-[390px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={groepOmzet.slice(0, 15)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="naam"
                  angle={-35}
                  textAnchor="end"
                  height={140}
                  interval={0}
                />
                <YAxis />
                <Tooltip formatter={(v) => formatEuro(v)} />
                <Bar dataKey="omzet" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 max-h-[220px] overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b text-left">
                  <th className="py-2">Groep</th>
                  <th className="py-2 text-right">
                    {jaar || "Huidig jaar"}
                  </th>
                  <th className="py-2 text-right">
                    {jaar ? Number(jaar) - 1 : "Vorig jaar"}
                  </th>
                  <th className="py-2 text-right">Verschil</th>
                </tr>
              </thead>
              <tbody>
                {groepOmzet.map((g, index) => (
                  <tr
                    key={g.naam}
                    className={`border-b ${
                      index % 2 === 0 ? "bg-white" : "bg-slate-50"
                    }`}
                  >
                    <td className="py-2 pr-2">{g.naam}</td>
                    <td
                      className={`py-2 text-right font-semibold ${
                        g.isHoger ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {formatEuro(g.omzet)}
                    </td>
                    <td className="py-2 text-right text-slate-500">
                      {formatEuro(g.omzetVorigJaar)}
                    </td>
                    <td
                      className={`py-2 text-right ${
                        g.verschil >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {formatEuro(g.verschil)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <h2 className="mb-4 font-bold">Best verkochte artikelen</h2>

          <div className="max-h-[650px] overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b text-left">
                  <th className="py-2">Artikel</th>
                  <th className="py-2 text-right">Aantal</th>
                  <th className="py-2 text-right">Omzet</th>
                </tr>
              </thead>
              <tbody>
                {bestVerkocht.map((a, index) => (
                  <tr
                    key={a.artnr}
                    className={`border-b ${
                      index % 2 === 0 ? "bg-white" : "bg-slate-50"
                    }`}
                  >
                    <td className="py-2 max-w-[320px]">
                      <div className="font-medium whitespace-normal break-words leading-tight">
                        {a.artikelnaam}
                      </div>
                      <div className="text-xs text-gray-500">{a.artnr}</div>
                    </td>
                    <td className="py-2 text-right w-[90px]">{formatAantal(a.aantal)}</td>
                    <td className="py-2 text-right w-[90px]">{formatEuro(a.omzet)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-5">
        <h2 className="mb-4 font-bold">Artikelen</h2>

        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-5">
          <input
            value={zoek}
            onChange={(e) => setZoek(e.target.value)}
            placeholder="Zoek artikel..."
            className="rounded-lg border px-3 py-2 text-sm"
          />

          <select
            value={hoofdgroep}
            onChange={(e) => {
              setHoofdgroep(e.target.value);
              setArtikelgroep("");
              setDeelgroep("");
              setSubgroep("");
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
            onChange={(e) => setSubgroep(e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm"
          >
            <option value="">Alle subgroepen</option>
            {filters?.subgroepen?.map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={loadArtikelen}
          className="mb-4 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white"
        >
          Filter toepassen
        </button>

        <div className="max-h-[520px] overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white">
              <tr className="border-b text-left">
                <th className="py-2">Art.nr</th>
                <th className="py-2">Artikel</th>
                <th className="py-2">Groep</th>
                <th className="py-2 text-right">Aantal</th>
                <th className="py-2 text-right">Omzet</th>
              </tr>
            </thead>
            <tbody>
              {artikelen.map((a, index) => (
                <tr
                  key={a.artnr}
                  onClick={() => openArtikel(a)}
                  className={`cursor-pointer border-b hover:bg-blue-50 ${
                    index % 2 === 0 ? "bg-white" : "bg-slate-50"
                  }`}
                >
                  <td className="py-2">{a.artnr}</td>
                  <td className="py-2 max-w-[250px]">
                    <div className="font-medium whitespace-normal break-words leading-tight">
                      {a.artikelnaam}
                    </div>
                    <div className="text-xs text-gray-500">{a.eenheid}</div>
                  </td>
                  <td className="py-2">
                    <div>{a.hoofdgroepnaam}</div>
                    <div className="text-xs text-gray-500">
                      {a.artikelgroepnaam} / {a.deelgroepnaam} / {a.subgroepnaam}
                    </div>
                  </td>
                  <td className="py-2 text-right font-semibold w-[100px]">{formatAantal(a.totaalAantal)}</td>
                  <td className="py-2 text-right font-semibold w-[100px]">{formatEuro(a.totaalOmzet)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedArtikel && (
        <div className="rounded-xl border bg-white p-5">
          <div className="mb-4">
            <h2 className="text-xl font-bold">{selectedArtikel.artikelnaam}</h2>
            <p className="text-sm text-gray-500">{selectedArtikel.artnr}</p>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <div className="rounded-lg border p-4">
              <h3 className="mb-3 font-bold">Omzet per jaar</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={perJaar}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="jaar" />
                    <YAxis />
                    <Tooltip formatter={(v) => formatEuro(v)} />
                    <Bar
                      dataKey="omzet"
                      shape={(props) => {
                        const { x, y, width, height, index } = props;
                        return (
                          <rect
                            x={x}
                            y={y}
                            width={width}
                            height={height}
                            fill={getBarColor(perJaar, index, "omzet")}
                          />
                        );
                      }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <h3 className="mb-3 font-bold">Omzet per maand</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={perMaand}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip formatter={(v) => formatEuro(v)} />
                    <Bar
                      dataKey="omzet"
                      shape={(props) => {
                        const { x, y, width, height, index } = props;
                        return (
                          <rect
                            x={x}
                            y={y}
                            width={width}
                            height={height}
                            fill={getBarColor(perMaand, index, "omzet")}
                          />
                        );
                      }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-lg border p-4">
            <h3 className="mb-3 font-bold">Wie koopt dit artikel?</h3>

            <div className="overflow-x-auto">
              <table className="min-w-[1050px] w-full table-fixed text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="w-[260px] py-2 text-left">Klant</th>
                    {klantJaren.map((j) => (
                      <th key={j} className="w-[130px] py-2 text-right">
                        Aantal {j}
                      </th>
                    ))}
                    <th className="w-[120px] py-2 text-right">Totaal</th>
                  </tr>
                </thead>

                <tbody>
                  {klanten.map((k, index) => (
                    <tr
                      key={`${k.klantnr}-${index}`}
                      className={`border-b ${
                        index % 2 === 0 ? "bg-white" : "bg-slate-50"
                      }`}
                    >
                      <td className="w-[260px] py-2 pr-3">
                        <div className="font-medium whitespace-normal break-words leading-tight">
                          {k.klantnaam || k.klantNaam || "Onbekend"}
                        </div>
                        <div className="text-xs text-gray-500">{k.klantnr ?? ""}</div>
                      </td>

                      <td className="w-[130px] py-2 text-right text-green-600">
                        {formatAantal(k.aantalHuidigJaar)}
                      </td>

                      <td
                        className={`w-[130px] py-2 text-right ${
                          Number(k.aantalVorigJaar || 0) <=
                          Number(k.aantalHuidigJaar || 0)
                            ? "text-red-600"
                            : "text-green-600"
                        }`}
                      >
                        {formatAantal(k.aantalVorigJaar)}
                      </td>

                      <td
                        className={`w-[130px] py-2 text-right ${
                          Number(k.aantalJaarMin2 || 0) <=
                          Number(k.aantalVorigJaar || 0)
                            ? "text-red-600"
                            : "text-green-600"
                        }`}
                      >
                        {formatAantal(k.aantalJaarMin2)}
                      </td>

                      <td
                        className={`w-[130px] py-2 text-right ${
                          Number(k.aantalJaarMin3 || 0) <=
                          Number(k.aantalJaarMin2 || 0)
                            ? "text-red-600"
                            : "text-green-600"
                        }`}
                      >
                        {formatAantal(k.aantalJaarMin3)}
                      </td>

                      <td
                        className={`w-[130px] py-2 text-right ${
                          Number(k.aantalJaarMin4 || 0) <=
                          Number(k.aantalJaarMin3 || 0)
                            ? "text-red-600"
                            : "text-green-600"
                        }`}
                      >
                        {formatAantal(k.aantalJaarMin4)}
                      </td>

                      <td className="w-[120px] py-2 text-right font-semibold">
                        {formatAantal(k.totaalAantal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}