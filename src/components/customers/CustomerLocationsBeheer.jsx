import { useState } from "react";
import { useMsal } from "@azure/msal-react";
import { apiRequest } from "../../authConfig";

export default function CustomerLocationsBeheer() {
  const [loading, setLoading] = useState(false);
  const [melding, setMelding] = useState("");
  const [progress, setProgress] = useState(0);

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

  const handleGeocode = async () => {
    try {
      setLoading(true);
      setMelding("");
      setProgress(15);

      const accessToken = await getAccessToken();
      setProgress(35);

      const res = await fetch(`${apiBase}/customers/geocode-missing`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      });

      setProgress(80);

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
            `Geocoding mislukt (status ${res.status}).`
        );
      }

      setProgress(100);
      setMelding(
        `Geocoding klaar. Totaal: ${data.total ?? 0}, verwerkt: ${data.processed ?? 0}, bijgewerkt: ${data.updated ?? 0}, overgeslagen: ${data.skipped ?? 0}.`
      );
    } catch (err) {
      setMelding(err.message || "Geocoding mislukt.");
      setProgress(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border bg-white p-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold">Beheer klantlocaties</h3>
          <p className="text-sm text-gray-500">
            Vult automatisch latitude en longitude in voor klanten zonder opgeslagen locatie.
          </p>
        </div>

        <button
          onClick={handleGeocode}
          disabled={loading}
          className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Bezig..." : "Geocode klanten"}
        </button>
      </div>

      {loading && (
        <div className="mb-4">
          <div className="mb-1 text-sm text-gray-500">Bezig met verwerken...</div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-blue-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {melding && (
        <div className="rounded-lg bg-gray-100 px-3 py-2 text-sm">
          {melding}
        </div>
      )}
    </div>
  );
}