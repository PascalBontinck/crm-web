import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMsal } from "@azure/msal-react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
} from "react-leaflet";
import L from "leaflet";
import { apiRequest } from "../authConfig";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL("leaflet/dist/images/marker-icon-2x.png", import.meta.url).href,
  iconUrl: new URL("leaflet/dist/images/marker-icon.png", import.meta.url).href,
  shadowUrl: new URL("leaflet/dist/images/marker-shadow.png", import.meta.url).href,
});

function formatCurrency(value) {
  return new Intl.NumberFormat("nl-BE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value ?? 0);
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [melding, setMelding] = useState("");
  const [search, setSearch] = useState("");
  const [filterVert, setFilterVert] = useState("");
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  const [sortField, setSortField] = useState("klantNaam");
  const [sortDirection, setSortDirection] = useState("asc");
  const [showScrollTop, setShowScrollTop] = useState(false);

  const { instance, accounts } = useMsal();
  const navigate = useNavigate();
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

  const loadCustomers = async () => {
    try {
      setLoading(true);
      setMelding("");

      const accessToken = await getAccessToken();

      const res = await fetch(`${apiBase}/customers`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      });

      const text = await res.text();
      let data = [];

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
            `Ophalen van klanten mislukt (status ${res.status}).`
        );
      }

      setCustomers(Array.isArray(data) ? data : []);
    } catch (err) {
      setMelding(err.message || "Ophalen van klanten mislukt.");
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const uniekeVerts = useMemo(() => {
    return [...new Set(customers.map((c) => c.vert).filter(Boolean))].sort();
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    const filtered = customers.filter((c) => {
      const term = search.trim().toLowerCase();

      const matchSearch =
        !term ||
        (c.klantNaam || "").toLowerCase().includes(term) ||
        (c.klantGemeente || "").toLowerCase().includes(term) ||
        String(c.klantnr || "").includes(term);

      const matchVert = !filterVert || c.vert === filterVert;
      const matchActive = !showActiveOnly || c.actief === true;

      return matchSearch && matchVert && matchActive;
    });

    filtered.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      if (aValue === null || aValue === undefined) aValue = "";
      if (bValue === null || bValue === undefined) bValue = "";

      if (typeof aValue === "string") aValue = aValue.toLowerCase();
      if (typeof bValue === "string") bValue = bValue.toLowerCase();

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [customers, search, filterVert, showActiveOnly, sortField, sortDirection]);

  const customersWithCoords = useMemo(() => {
    return filteredCustomers.filter(
      (c) =>
        c.latitude !== null &&
        c.latitude !== undefined &&
        c.longitude !== null &&
        c.longitude !== undefined
    );
  }, [filteredCustomers]);

  const mapCenter = useMemo(() => {
    if (customersWithCoords.length === 0) {
      return [50.8503, 4.3517]; // België fallback
    }

    const avgLat =
      customersWithCoords.reduce((sum, c) => sum + Number(c.latitude), 0) /
      customersWithCoords.length;

    const avgLng =
      customersWithCoords.reduce((sum, c) => sum + Number(c.longitude), 0) /
      customersWithCoords.length;

    return [avgLat, avgLng];
  }, [customersWithCoords]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortIcon = (field) => {
    if (sortField !== field) return "↕";
    return sortDirection === "asc" ? "↑" : "↓";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Klanten</h1>
      </div>

      <div className="rounded-xl border bg-white p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Klantenlijst</h2>
            <p className="text-sm text-gray-500">
              {loading ? "Klanten laden..." : `${filteredCustomers.length} klanten gevonden`}
            </p>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-4">
          <input
            type="text"
            placeholder="Zoek naam, gemeente of klantnr..."
            className="rounded-lg border px-4 py-2"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="rounded-lg border px-4 py-2"
            value={filterVert}
            onChange={(e) => setFilterVert(e.target.value)}
          >
            <option value="">Alle verkopers</option>
            {uniekeVerts.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showActiveOnly}
              onChange={() => setShowActiveOnly(!showActiveOnly)}
            />
            Enkel actief
          </label>
        </div>

        {melding && (
          <div className="mb-4 rounded-lg bg-gray-100 px-3 py-2 text-sm">
            {melding}
          </div>
        )}

        {!loading && (
          <div className="mb-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-gray-100 px-3 py-1 text-sm">
              Totaal: {filteredCustomers.length}
            </span>
            <span className="rounded-full bg-green-50 px-3 py-1 text-sm text-green-700">
              Actief: {filteredCustomers.filter((c) => c.actief).length}
            </span>
            <span className="rounded-full bg-red-50 px-3 py-1 text-sm text-red-700">
              Niet actief: {filteredCustomers.filter((c) => !c.actief).length}
            </span>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-700">
              Op kaart: {customersWithCoords.length}
            </span>
          </div>
        )}

        {!loading && (
          <div className="mb-6 rounded-xl border bg-white p-4">
            <h3 className="mb-3 text-lg font-semibold">Overzichtskaart klanten</h3>

            {customersWithCoords.length === 0 ? (
              <div className="text-sm text-gray-500">
                Geen klanten met opgeslagen locatie gevonden.
              </div>
            ) : (
              <div className="h-[450px] overflow-hidden rounded-lg border">
                <MapContainer
                  center={mapCenter}
                  zoom={10}
                  scrollWheelZoom={true}
                  style={{ height: "100%", width: "100%" }}
                >
                  <TileLayer
                    attribution='&copy; OpenStreetMap contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  {customersWithCoords.map((customer) => (
                    <Marker
                      key={customer.id}
                      position={[Number(customer.latitude), Number(customer.longitude)]}
                    >
                      <Popup>
                        <div className="space-y-2">
                          <div>
                            <strong>{customer.klantNaam}</strong>
                          </div>
                          <div>Klantnr: {customer.klantnr}</div>
                          <div>
                            {customer.klantStraat || ""}
                            <br />
                            {customer.klantPost || ""} {customer.klantGemeente || ""}
                          </div>
                          <div>Vert: {customer.vert || "-"}</div>
                          <div>Omzet huidig jaar: € {formatCurrency(customer.omzetHuidigJaar)}</div>

                          <button
                            onClick={() => navigate(`/customers/${customer.id}`)}
                            className="rounded-lg bg-blue-600 px-3 py-1 text-white hover:bg-blue-700"
                          >
                            Open klantenfiche
                          </button>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
            )}
          </div>
        )}

        {loading ? (
          <div className="py-6 text-sm text-gray-500">Klanten laden...</div>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="min-w-full border-collapse">
              <thead className="bg-gray-50">
                <tr className="text-left">
                  <th
                    className="cursor-pointer px-3 py-3 font-semibold"
                    onClick={() => handleSort("klantnr")}
                  >
                    Klantnr {sortIcon("klantnr")}
                  </th>
                  <th
                    className="cursor-pointer px-3 py-3 font-semibold"
                    onClick={() => handleSort("klantNaam")}
                  >
                    Naam {sortIcon("klantNaam")}
                  </th>
                  <th
                    className="cursor-pointer px-3 py-3 font-semibold"
                    onClick={() => handleSort("klantGemeente")}
                  >
                    Gemeente {sortIcon("klantGemeente")}
                  </th>
                  <th
                    className="cursor-pointer px-3 py-3 font-semibold"
                    onClick={() => handleSort("vert")}
                  >
                    Vert {sortIcon("vert")}
                  </th>
                  <th
                    className="cursor-pointer px-3 py-3 font-semibold"
                    onClick={() => handleSort("omzetHuidigJaar")}
                  >
                    Omzet huidig jaar {sortIcon("omzetHuidigJaar")}
                  </th>
                  <th
                    className="cursor-pointer px-3 py-3 font-semibold"
                    onClick={() => handleSort("actief")}
                  >
                    Actief {sortIcon("actief")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-3 py-6 text-center text-sm text-gray-500">
                      Geen klanten gevonden.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((c) => (
                    <tr
                      key={c.id}
                      className="cursor-pointer border-t hover:bg-gray-50"
                      onClick={() => navigate(`/customers/${c.id}`)}
                    >
                      <td className="px-3 py-3">{c.klantnr}</td>
                      <td className="px-3 py-3 font-medium">{c.klantNaam}</td>
                      <td className="px-3 py-3">{c.klantGemeente || "-"}</td>
                      <td className="px-3 py-3">{c.vert || "-"}</td>
                      <td className="px-3 py-3 text-right">
                        € {formatCurrency(c.omzetHuidigJaar)}
                      </td>
                      <td className="px-3 py-3">
                        {c.actief ? (
                          <span className="rounded-full bg-green-50 px-3 py-1 text-sm text-green-700">
                            Actief
                          </span>
                        ) : (
                          <span className="rounded-full bg-red-50 px-3 py-1 text-sm text-red-700">
                            Niet actief
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 rounded-full bg-blue-600 p-3 text-white shadow-lg hover:bg-blue-700"
          title="Naar boven"
        >
          ↑
        </button>
      )}
    </div>
  );
}