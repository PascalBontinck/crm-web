import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMsal } from "@azure/msal-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import { apiRequest } from "../authConfig";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL(
    "leaflet/dist/images/marker-icon-2x.png",
    import.meta.url
  ).href,
  iconUrl: new URL("leaflet/dist/images/marker-icon.png", import.meta.url).href,
  shadowUrl: new URL("leaflet/dist/images/marker-shadow.png", import.meta.url)
    .href,
});

function ClickableMapMarker({ position, onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick({
        lat: e.latlng.lat,
        lng: e.latlng.lng,
      });
    },
  });

  if (!position) return null;

  return (
    <Marker position={[position.lat, position.lng]}>
      <Popup>Geselecteerde locatie</Popup>
    </Marker>
  );
}

function InfoCard({ title, children }) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <h2 className="mb-3 text-lg font-semibold">{title}</h2>
      <div className="space-y-2 text-sm">{children}</div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-3 py-1">
      <div className="font-semibold text-black">{label}</div>
      <div>{children}</div>
    </div>
  );
}

function MailLink({ value }) {
  if (!value || value === "-") return <span>-</span>;

  return (
    <a
      href={`mailto:${value}`}
      className="text-blue-600 underline hover:text-blue-800"
      onClick={(e) => e.stopPropagation()}
    >
      {value}
    </a>
  );
}

function PhoneLink({ value }) {
  if (!value || value === "-") return <span>-</span>;

  const telValue = value.replace(/\s+/g, "");
  return (
    <a
      href={`tel:${telValue}`}
      className="text-blue-600 underline hover:text-blue-800"
      onClick={(e) => e.stopPropagation()}
    >
      {value}
    </a>
  );
}

function formatCurrency(value) {
  return new Intl.NumberFormat("nl-BE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value ?? 0);
}

function formatPercentage(value) {
  if (value === null || value === undefined) return "—";

  return (
    new Intl.NumberFormat("nl-BE", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value) + " %"
  );
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("nl-BE");
}

function getBarColor(current, previous) {
  if (previous === null || previous === undefined) return "#16a34a";
  return current >= previous ? "#16a34a" : "#dc2626";
}

function Difference({ value, type = "aantal" }) {
  const val = Number(value || 0);

  return (
    <span className={val >= 0 ? "text-green-700" : "text-red-700"}>
      {val >= 0 ? "▲ " : "▼ "}
      {type === "euro" ? `€ ${formatCurrency(val)}` : formatCurrency(val)}
    </span>
  );
}

function ArtikelAnalyseTable({ title, rows = [], jaar, vorigJaar }) {
  return (
    <InfoCard title={title}>
      <div className="max-h-[420px] overflow-auto">
        <table className="min-w-[1100px] w-full text-sm">
          <thead className="sticky top-0 bg-white">
            <tr className="border-b text-left">
              <th className="w-[320px] py-2">Artikel</th>
              <th className="py-2 text-right">Aantal {jaar}</th>
              <th className="py-2 text-right">Aantal {vorigJaar}</th>
              <th className="py-2 text-right">Δ aantal</th>
              <th className="py-2 text-right border-l pl-4">Omzet {jaar}</th>
              <th className="py-2 text-right">Omzet {vorigJaar}</th>
              <th className="py-2 text-right">Δ omzet</th>
              <th className="py-2 text-right">Laatste aankoop</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((r, index) => (
              <tr
                key={`${r.artnr}-${index}`}
                className={`border-b ${
                  index % 2 === 0 ? "bg-white" : "bg-slate-50"
                }`}
              >
                <td className="py-2 pr-3">
                  <div className="font-medium whitespace-normal break-words leading-tight">
                    {r.artikelnaam || "Onbekend"}
                  </div>
                  <div className="text-xs text-gray-500">
                    {r.artnr} · {r.hoofdgroepnaam || "-"} /{" "}
                    {r.artikelgroepnaam || "-"}
                  </div>
                </td>

                <td className="py-2 text-right">
                  {formatCurrency(r.aantalHuidig)}
                </td>
                <td className="py-2 text-right">
                  {formatCurrency(r.aantalVorig)}
                </td>
                <td className="py-2 text-right font-semibold">
                  <Difference value={r.aantalVerschil} />
                </td>

                <td className="py-2 text-right border-l pl-4">
                  € {formatCurrency(r.omzetHuidig)}
                </td>
                <td className="py-2 text-right">
                  € {formatCurrency(r.omzetVorig)}
                </td>
                <td className="py-2 text-right font-semibold">
                  <Difference value={r.omzetVerschil} type="euro" />
                </td>

                <td className="py-2 text-right text-gray-500">
                  {formatDate(r.laatsteAankoop)}
                </td>
              </tr>
            ))}

            {rows.length === 0 && (
              <tr>
                <td colSpan="8" className="py-6 text-center text-gray-500">
                  Geen gegevens gevonden.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </InfoCard>
  );
}

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { instance, accounts } = useMsal();

  const [customer, setCustomer] = useState(null);
  const [monthlyRevenue, setMonthlyRevenue] = useState([]);
  const [yearlyRevenue, setYearlyRevenue] = useState([]);
  const [artikelAnalyse, setArtikelAnalyse] = useState(null);

  const [selectedYear, setSelectedYear] = useState(null);
  const [mapPosition, setMapPosition] = useState(null);
  const [mapLoading, setMapLoading] = useState(false);
  const [savingLocation, setSavingLocation] = useState(false);
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
    const loadCustomer = async () => {
      try {
        setLoading(true);
        setMelding("");
        setArtikelAnalyse(null);

        const accessToken = await getAccessToken();

        const customerRes = await fetch(`${apiBase}/customers/${id}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/json",
          },
        });

        const customerText = await customerRes.text();
        let customerData = null;

        if (customerText) {
          try {
            customerData = JSON.parse(customerText);
          } catch {
            throw new Error("Backend gaf geen geldige JSON terug.");
          }
        }

        if (!customerRes.ok) {
          throw new Error(
            customerData?.details ||
              customerData?.innerError ||
              customerData?.error ||
              customerData?.message ||
              `Ophalen van klant mislukt (status ${customerRes.status}).`
          );
        }

        setCustomer(customerData);

        const artikelAnalyseRes = await fetch(
          `${apiBase}/artikelkopersanalyse/klant/${customerData.klantnr}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              Accept: "application/json",
            },
          }
        );

        if (artikelAnalyseRes.ok) {
          const artikelAnalyseText = await artikelAnalyseRes.text();
          if (artikelAnalyseText) {
            setArtikelAnalyse(JSON.parse(artikelAnalyseText));
          }
        }

        const monthlyRes = await fetch(
          `${apiBase}/invoices/customer/${customerData.klantnr}/monthly`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              Accept: "application/json",
            },
          }
        );

        const monthlyText = await monthlyRes.text();
        let monthlyData = [];

        if (monthlyText) {
          try {
            monthlyData = JSON.parse(monthlyText);
          } catch {
            throw new Error("Backend gaf geen geldige JSON terug.");
          }
        }

        if (!monthlyRes.ok) {
          throw new Error(
            monthlyData?.details ||
              monthlyData?.innerError ||
              monthlyData?.error ||
              monthlyData?.message ||
              `Ophalen van maandomzet mislukt (status ${monthlyRes.status}).`
          );
        }

        setMonthlyRevenue(Array.isArray(monthlyData) ? monthlyData : []);

        const yearlyRes = await fetch(
          `${apiBase}/invoices/customer/${customerData.klantnr}/yearly`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              Accept: "application/json",
            },
          }
        );

        const yearlyText = await yearlyRes.text();
        let yearlyData = [];

        if (yearlyText) {
          try {
            yearlyData = JSON.parse(yearlyText);
          } catch {
            throw new Error("Backend gaf geen geldige JSON terug.");
          }
        }

        if (!yearlyRes.ok) {
          throw new Error(
            yearlyData?.details ||
              yearlyData?.innerError ||
              yearlyData?.error ||
              yearlyData?.message ||
              `Ophalen van jaaromzet mislukt (status ${yearlyRes.status}).`
          );
        }

        const sortedYearly = Array.isArray(yearlyData)
          ? [...yearlyData].sort((a, b) =>
              String(a.jaar).localeCompare(String(b.jaar))
            )
          : [];

        setYearlyRevenue(sortedYearly);

        if (sortedYearly.length > 0) {
          setSelectedYear(String(sortedYearly[sortedYearly.length - 1].jaar));
        }
      } catch (err) {
        setMelding(err.message || "Ophalen van klant mislukt.");
      } finally {
        setLoading(false);
      }
    };

    loadCustomer();
  }, [id]);

  useEffect(() => {
    const loadCoordinates = async () => {
      if (!customer) return;

      if (customer.latitude && customer.longitude) {
        setMapPosition({
          lat: Number(customer.latitude),
          lng: Number(customer.longitude),
        });
        return;
      }

      const straat = (customer.klantStraat || "").trim();
      const post = (customer.klantPost || "").trim();
      const gemeente = (customer.klantGemeente || "").trim();

      const gemeenteKort = gemeente.includes("-")
        ? gemeente.split("-").pop().trim()
        : gemeente;

      const queries = [
        `${straat}, ${post} ${gemeente}, België`,
        `${straat}, ${post} ${gemeente}, Belgium`,
        `${post} ${gemeente}, België`,
        `${post} ${gemeente}, Belgium`,
        `${gemeente}, België`,
        `${gemeente}, Belgium`,
        `${straat}, ${gemeente}, België`,
        `${post} ${gemeenteKort}, België`,
        `${gemeenteKort}, België`,
        `${straat}, ${gemeenteKort}, België`,
      ].filter(Boolean);

      try {
        setMapLoading(true);
        setMapPosition(null);

        for (const query of queries) {
          const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=be&q=${encodeURIComponent(
            query
          )}`;

          const res = await fetch(url, {
            headers: {
              Accept: "application/json",
            },
          });

          const data = await res.json();

          if (Array.isArray(data) && data.length > 0) {
            setMapPosition({
              lat: Number(data[0].lat),
              lng: Number(data[0].lon),
            });
            return;
          }
        }

        setMapPosition(null);
      } catch {
        setMapPosition(null);
      } finally {
        setMapLoading(false);
      }
    };

    loadCoordinates();
  }, [customer]);

  const saveLocation = async () => {
    if (!mapPosition) return;

    try {
      setSavingLocation(true);

      const accessToken = await getAccessToken();

      const res = await fetch(`${apiBase}/customers/${id}/location`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          latitude: mapPosition.lat,
          longitude: mapPosition.lng,
        }),
      });

      const text = await res.text();
      let data = null;

      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          data = null;
        }
      }

      if (!res.ok) {
        throw new Error(
          data?.details ||
            data?.innerError ||
            data?.error ||
            data?.message ||
            `Opslaan van locatie mislukt (status ${res.status}).`
        );
      }

      setCustomer((prev) =>
        prev
          ? {
              ...prev,
              latitude: mapPosition.lat,
              longitude: mapPosition.lng,
            }
          : prev
      );

      alert("Locatie succesvol opgeslagen.");
    } catch (err) {
      alert(err.message || "Opslaan van locatie mislukt.");
    } finally {
      setSavingLocation(false);
    }
  };

  const currentYear = new Date().getFullYear().toString();

  const omzetHuidigJaar = useMemo(() => {
    const match = yearlyRevenue.find((y) => String(y.jaar) === currentYear);
    return match?.omzet ?? 0;
  }, [yearlyRevenue, currentYear]);

  const yearlyChartData = useMemo(() => {
    const sorted = [...yearlyRevenue].sort((a, b) =>
      String(a.jaar).localeCompare(String(b.jaar))
    );

    const last10 = sorted.slice(-10);

    return last10.map((item, index) => {
      const previous = index > 0 ? last10[index - 1].omzet : null;

      return {
        ...item,
        jaar: String(item.jaar),
        previousOmzet: previous,
        fill: getBarColor(item.omzet, previous),
      };
    });
  }, [yearlyRevenue]);

  const monthlyComparisonData = useMemo(() => {
    if (!selectedYear) return [];

    const previousYear = String(Number(selectedYear) - 1);

    const months = Array.from({ length: 12 }, (_, i) => {
      const month = String(i + 1).padStart(2, "0");
      return `${selectedYear}.${month}`;
    });

    return months.map((periode) => {
      const month = periode.slice(5, 7);
      const previousPeriode = `${previousYear}.${month}`;

      const currentMatch = monthlyRevenue.find((m) => m.periode === periode);
      const previousMatch = monthlyRevenue.find(
        (m) => m.periode === previousPeriode
      );

      const omzetHuidigJaar = currentMatch?.omzet ?? 0;
      const omzetVorigJaar = previousMatch?.omzet ?? 0;
      const verschil = omzetHuidigJaar - omzetVorigJaar;

      let verschilPercentage = null;

      if (omzetVorigJaar !== 0) {
        verschilPercentage = (verschil / omzetVorigJaar) * 100;
      } else if (omzetHuidigJaar === 0) {
        verschilPercentage = 0;
      }

      return {
        maand: month,
        omzetHuidigJaar,
        omzetVorigJaar,
        verschil,
        verschilPercentage,
      };
    });
  }, [monthlyRevenue, selectedYear]);

  const googleMapsUrl = useMemo(() => {
    if (!customer) return null;

    const parts = [
      customer.klantStraat,
      customer.klantPost,
      customer.klantGemeente,
      "Belgium",
    ].filter(Boolean);

    if (parts.length === 0) return null;

    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      parts.join(", ")
    )}`;
  }, [customer]);

  if (loading) {
    return <div className="p-6">Laden...</div>;
  }

  if (melding) {
    return (
      <div className="p-6">
        <div className="rounded-lg bg-gray-100 px-3 py-2 text-sm">
          {melding}
        </div>
      </div>
    );
  }

  if (!customer) {
    return <div className="p-6">Geen klant gevonden.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{customer.klantNaam}</h1>
        <p className="text-sm text-gray-500">
          Klantnr {customer.klantnr} ·{" "}
          {customer.vert || "Geen vertegenwoordiger"}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {customer.actief ? (
          <span className="rounded-full bg-green-50 px-3 py-1 text-sm text-green-700">
            Actief
          </span>
        ) : (
          <span className="rounded-full bg-red-50 px-3 py-1 text-sm text-red-700">
            Niet actief
          </span>
        )}
      </div>

      <InfoCard title="Omzet huidig jaar">
        <div className="text-3xl font-bold">
          € {formatCurrency(omzetHuidigJaar)}
        </div>
        <div className="text-sm text-gray-500">Excl. btw</div>
      </InfoCard>

      <InfoCard title="Omzet per jaar">
        {yearlyChartData.length === 0 ? (
          <div className="text-sm text-gray-500">
            Geen omzetgegevens gevonden.
          </div>
        ) : (
          <>
            <div className="mb-3 text-sm text-gray-500">
              Klik op een jaartal om de maandomzet en vergelijking met het jaar
              ervoor te tonen.
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={yearlyChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="jaar" />
                  <YAxis tickFormatter={(value) => `€ ${formatCurrency(value)}`} />
                  <Tooltip formatter={(value) => `€ ${formatCurrency(value)}`} />
                  <Bar
                    dataKey="omzet"
                    onClick={(data) => {
                      if (data?.jaar) setSelectedYear(String(data.jaar));
                    }}
                  >
                    {yearlyChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.fill}
                        cursor="pointer"
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </InfoCard>

      {selectedYear && (
        <InfoCard
          title={`Omzet per maand - ${selectedYear} vs ${
            Number(selectedYear) - 1
          }`}
        >
          <div className="mb-3 text-sm text-gray-500">
            Vergelijking van elke maand met hetzelfde maandcijfer van het jaar
            ervoor.
          </div>

          {monthlyComparisonData.every(
            (m) => m.omzetHuidigJaar === 0 && m.omzetVorigJaar === 0
          ) ? (
            <div className="text-sm text-gray-500">
              Geen maandgegevens gevonden.
            </div>
          ) : (
            <>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyComparisonData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="maand" />
                    <YAxis tickFormatter={(value) => `€ ${formatCurrency(value)}`} />
                    <Tooltip formatter={(value) => `€ ${formatCurrency(value)}`} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="omzetHuidigJaar"
                      name={selectedYear}
                      stroke="#16a34a"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="omzetVorigJaar"
                      name={String(Number(selectedYear) - 1)}
                      stroke="#dc2626"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4 overflow-x-auto rounded-lg border">
                <table className="min-w-full border-collapse text-sm">
                  <thead className="bg-gray-50">
                    <tr className="text-left">
                      <th className="px-3 py-2">Maand</th>
                      <th className="px-3 py-2 text-right">{selectedYear}</th>
                      <th className="px-3 py-2 text-right">
                        {Number(selectedYear) - 1}
                      </th>
                      <th className="px-3 py-2 text-right">Verschil</th>
                      <th className="px-3 py-2 text-right">Verschil %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyComparisonData.map((row) => (
                      <tr key={row.maand} className="border-t">
                        <td className="px-3 py-2">{row.maand}</td>
                        <td className="px-3 py-2 text-right">
                          € {formatCurrency(row.omzetHuidigJaar)}
                        </td>
                        <td className="px-3 py-2 text-right">
                          € {formatCurrency(row.omzetVorigJaar)}
                        </td>
                        <td
                          className={`px-3 py-2 text-right ${
                            row.verschil >= 0
                              ? "text-green-700"
                              : "text-red-700"
                          }`}
                        >
                          € {formatCurrency(row.verschil)}
                        </td>
                        <td
                          className={`px-3 py-2 text-right ${
                            row.verschil >= 0
                              ? "text-green-700"
                              : "text-red-700"
                          }`}
                        >
                          {formatPercentage(row.verschilPercentage)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </InfoCard>
      )}

      {artikelAnalyse && (
        <div className="space-y-4">
          <InfoCard title="Artikelanalyse van deze klant">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div>
                <div className="text-sm text-gray-500">Koopt nu</div>
                <div className="text-2xl font-bold text-green-700">
                  {artikelAnalyse.kooptNu?.length || 0}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Koopt niet meer</div>
                <div className="text-2xl font-bold text-red-700">
                  {artikelAnalyse.kooptNietMeer?.length || 0}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Koopt minder</div>
                <div className="text-2xl font-bold text-orange-600">
                  {artikelAnalyse.kooptMinder?.length || 0}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Nieuwe artikelen</div>
                <div className="text-2xl font-bold text-green-700">
                  {artikelAnalyse.kooptNieuw?.length || 0}
                </div>
              </div>
            </div>
          </InfoCard>

          <ArtikelAnalyseTable
            title="Artikelen die deze klant nu koopt"
            rows={artikelAnalyse.kooptNu}
            jaar={artikelAnalyse.jaar}
            vorigJaar={artikelAnalyse.vorigJaar}
          />

          <ArtikelAnalyseTable
            title="Artikelen die deze klant niet meer koopt"
            rows={artikelAnalyse.kooptNietMeer}
            jaar={artikelAnalyse.jaar}
            vorigJaar={artikelAnalyse.vorigJaar}
          />

          <ArtikelAnalyseTable
            title="Artikelen die deze klant minder koopt"
            rows={artikelAnalyse.kooptMinder}
            jaar={artikelAnalyse.jaar}
            vorigJaar={artikelAnalyse.vorigJaar}
          />

          <ArtikelAnalyseTable
            title="Nieuwe artikelen bij deze klant"
            rows={artikelAnalyse.kooptNieuw}
            jaar={artikelAnalyse.jaar}
            vorigJaar={artikelAnalyse.vorigJaar}
          />
        </div>
      )}

      <InfoCard title="Locatie">
        <div className="text-sm text-gray-500">
          Klik op de kaart om de marker te verplaatsen en sla daarna de locatie
          op.
        </div>

        {mapLoading ? (
          <div className="text-sm text-gray-500">Locatie laden...</div>
        ) : mapPosition ? (
          <div className="space-y-3">
            <div className="text-sm text-gray-500">
              Geselecteerde coördinaten: {mapPosition.lat}, {mapPosition.lng}
            </div>

            <div className="h-[400px] w-full overflow-hidden rounded-lg border">
              <MapContainer
                center={[mapPosition.lat, mapPosition.lng]}
                zoom={15}
                scrollWheelZoom={true}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  attribution="&copy; OpenStreetMap contributors"
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <ClickableMapMarker
                  position={mapPosition}
                  onMapClick={setMapPosition}
                />
              </MapContainer>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={saveLocation}
                disabled={savingLocation}
                className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {savingLocation ? "Opslaan..." : "Opslaan locatie"}
              </button>

              <button
                onClick={() =>
                  navigate("/reports", {
                    state: { customerId: customer.id },
                  })
                }
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                Rapporten beheren
              </button>

              {googleMapsUrl && (
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                >
                  Open in Google Maps
                </a>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-sm text-gray-500">
              Locatie kon niet bepaald worden op basis van het adres.
            </div>

            {googleMapsUrl && (
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-block rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                Open in Google Maps
              </a>
            )}
          </div>
        )}
      </InfoCard>

      <div className="grid gap-4 md:grid-cols-2">
        <InfoCard title="Algemeen">
          <Field label="Klantnr:">{customer.klantnr}</Field>
          <Field label="Actief:">{customer.actief ? "Ja" : "Nee"}</Field>
          <Field label="Vert:">{customer.vert || "-"}</Field>
          <Field label="Klantgroep:">{customer.klantgroep || "-"}</Field>
          <Field label="Last order:">{customer.lastOrder || "-"}</Field>
        </InfoCard>

        <InfoCard title="Adres">
          <Field label="Straat:">{customer.klantStraat || "-"}</Field>
          <Field label="Postcode:">{customer.klantPost || "-"}</Field>
          <Field label="Gemeente:">{customer.klantGemeente || "-"}</Field>
        </InfoCard>

        <InfoCard title="Onderneming">
          <Field label="BTW:">{customer.klantBTW || "-"}</Field>
          <Field label="Ondernemingsnr:">{customer.klantOnder || "-"}</Field>
        </InfoCard>

        <InfoCard title="Contact">
          <Field label="Telefoon:">
            <PhoneLink value={customer.telefoon} />
          </Field>
          <Field label="GSM:">
            <PhoneLink value={customer.gsm} />
          </Field>
        </InfoCard>

        <InfoCard title="E-mail">
          <Field label="Algemeen:">
            <MailLink value={customer.mail} />
          </Field>
          <Field label="Aankoop:">
            <MailLink value={customer.mailAankoop} />
          </Field>
          <Field label="Boekhouding:">
            <MailLink value={customer.mailBoekhouding} />
          </Field>
          <Field label="E-commerce:">
            <MailLink value={customer.mailEcommerce} />
          </Field>
          <Field label="Facturatie:">
            <MailLink value={customer.mailFacturatie} />
          </Field>
          <Field label="Extra:">
            <MailLink value={customer.mailExtra} />
          </Field>
        </InfoCard>

        <InfoCard title="Toelichting">
          <div className="max-h-48 overflow-y-auto whitespace-pre-wrap text-sm">
            {customer.toelichting || "-"}
          </div>
        </InfoCard>
      </div>
    </div>
  );
}