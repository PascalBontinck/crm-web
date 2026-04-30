import { useState } from "react";
import { useMsal } from "@azure/msal-react";
import { apiRequest } from "../../authConfig";

export default function ArtikelHistoriekBeheer() {
  const [loading, setLoading] = useState(false);
  const [melding, setMelding] = useState("");

  const { instance, accounts } = useMsal();
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

  const handleImport = async () => {
    try {
      setLoading(true);
      setMelding("");

      const accessToken = await getAccessToken();

      const res = await fetch(`${apiBase}/artikelhistoriek/import`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || data?.message || "Import mislukt.");
      }

      setMelding(
        `Import artikelhistoriek succesvol. Artikelen nieuw: ${data.artikelenAdded ?? 0}, ` +
          `bijgewerkt: ${data.artikelenUpdated ?? 0}, historieken: ${data.historiekenAdded ?? 0}, ` +
          `klanten gekoppeld: ${data.klantenGekoppeld ?? 0}, niet gevonden: ${data.klantenNietGevonden ?? 0}.`
      );
    } catch (err) {
      setMelding(err.message || "Import artikelhistoriek mislukt.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold">Beheer artikelhistoriek</h3>
          <p className="text-sm text-gray-500">
            Importeert Artikels.xlsx en Historieken.xlsx.
          </p>
        </div>

        <button
          onClick={handleImport}
          disabled={loading}
          className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Importeren..." : "Importeer artikelhistoriek"}
        </button>
      </div>

      {melding && (
        <div className="rounded-lg bg-gray-100 px-3 py-2 text-sm">
          {melding}
        </div>
      )}
    </div>
  );
}