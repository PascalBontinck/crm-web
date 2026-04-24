import { useEffect, useState } from "react";
import UserPickerModal from "./UserPickerModal";

export default function VerkopersBeheer() {
  const [verkopers, setVerkopers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [melding, setMelding] = useState("");
  const [selectedVerkoper, setSelectedVerkoper] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const apiBase = "http://localhost:5205/api";

  const loadData = async () => {
    try {
      const res = await fetch(`${apiBase}/verkopers`);

      if (!res.ok) {
        throw new Error("Kon verkopers niet ophalen.");
      }

      const data = await res.json();
      setVerkopers(Array.isArray(data) ? data : []);
    } catch (err) {
      setMelding(err.message || "Fout bij ophalen van verkopers.");
      setVerkopers([]);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const saveVerkoper = async (verkoper) => {
    const res = await fetch(`${apiBase}/verkopers/${verkoper.nummer}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(verkoper),
    });

    if (!res.ok) {
      let foutmelding = "Opslaan van verkoper mislukt.";

      try {
        const data = await res.json();
        foutmelding = data.error || data.message || foutmelding;
      } catch {
        // niets doen
      }

      throw new Error(foutmelding);
    }
  };

  const toggleActief = async (v) => {
    try {
      setMelding("");

      const updated = {
        ...v,
        actief: !v.actief,
      };

      await saveVerkoper(updated);
      await loadData();
    } catch (err) {
      setMelding(err.message || "Wijzigen van actief mislukt.");
    }
  };

  const handleImport = async () => {
    try {
      setLoading(true);
      setMelding("");

      const res = await fetch(`${apiBase}/verkopers/import`, {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.message || "Import mislukt.");
      }

      setMelding(
        `${data.message} Verwerkt: ${data.processed}, nieuw: ${data.added}, aangepast: ${data.updated}`
      );

      await loadData();
    } catch (err) {
      setMelding(err.message || "Import mislukt.");
    } finally {
      setLoading(false);
    }
  };

  const openUserPicker = (verkoper) => {
    setSelectedVerkoper(verkoper);
    setModalOpen(true);
  };

  const handleUserSelect = async (user) => {
    if (!selectedVerkoper) return;

    try {
      setMelding("");

      const updated = {
        ...selectedVerkoper,
        naam: user.displayName,
      };

      await saveVerkoper(updated);
      setModalOpen(false);
      setSelectedVerkoper(null);
      await loadData();
    } catch (err) {
      setMelding(err.message || "Koppelen van gebruiker mislukt.");
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedVerkoper(null);
  };

  return (
    <div className="rounded-xl border bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold">Beheer verkopers</h3>
          <p className="text-sm text-gray-500">
            Import vanuit Vert.xlsx en beheer van naam/actief.
          </p>
        </div>

        <button
          onClick={handleImport}
          disabled={loading}
          className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Importeren..." : "Importeer uit Excel"}
        </button>
      </div>

      {melding && (
        <div className="mb-4 rounded-lg bg-gray-100 px-3 py-2 text-sm">
          {melding}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="border-b text-left">
              <th className="px-3 py-2">Nummer</th>
              <th className="px-3 py-2">Verkoper</th>
              <th className="px-3 py-2">Naam</th>
              <th className="px-3 py-2">Actief</th>
            </tr>
          </thead>
          <tbody>
            {verkopers.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-3 py-6 text-center text-sm text-gray-500">
                  Geen verkopers gevonden.
                </td>
              </tr>
            ) : (
              verkopers.map((v) => (
                <tr key={v.nummer} className="border-b">
                  <td className="px-3 py-2">{v.nummer}</td>
                  <td className="px-3 py-2">{v.verkoperNaam}</td>
                  <td className="px-3 py-2">
                    <button
                      onClick={() => openUserPicker(v)}
                      className={`rounded-lg border px-3 py-1 text-sm transition
                        ${
                          v.naam
                            ? "border-green-300 bg-green-50 text-green-700 hover:bg-green-100"
                            : "border-red-300 bg-red-50 text-red-700 hover:bg-red-100"
                        }
                      `}
                    >
                      {v.naam || "Kies gebruiker"}
                    </button>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={v.actief}
                      onChange={() => toggleActief(v)}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <UserPickerModal
        open={modalOpen}
        onClose={closeModal}
        onSelect={handleUserSelect}
      />
    </div>
  );
}