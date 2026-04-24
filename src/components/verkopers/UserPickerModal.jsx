import { useEffect, useState } from "react";

export default function UserPickerModal({ open, onClose, onSelect }) {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fout, setFout] = useState("");

  const apiBase = "http://localhost:5205/api";

  const loadUsers = async (value) => {
    try {
      setLoading(true);
      setFout("");

      const res = await fetch(
        `${apiBase}/verkopers/m365-users?search=${encodeURIComponent(value)}`
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error ||
            data.message ||
            "Ophalen van Microsoft 365-gebruikers mislukt."
        );
      }

      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setUsers([]);
      setFout(err.message || "Ophalen van Microsoft 365-gebruikers mislukt.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;

    setSearch("");
    loadUsers("");
  }, [open]);

  const handleSearchChange = async (e) => {
    const value = e.target.value;
    setSearch(value);
    await loadUsers(value);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">
        <div className="border-b px-6 py-4">
          <h3 className="text-lg font-bold">Kies Microsoft 365 gebruiker</h3>
          <p className="text-sm text-gray-500">
            Zoek op naam, e-mail of user principal name.
          </p>
        </div>

        <div className="px-6 py-4">
          <input
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder="Zoek gebruiker..."
            className="w-full rounded-lg border px-3 py-2 outline-none focus:ring"
          />
        </div>

        <div className="max-h-96 overflow-y-auto px-6 pb-4">
          {loading ? (
            <div className="py-4 text-sm text-gray-500">Laden...</div>
          ) : fout ? (
            <div className="py-4 text-sm text-red-600">{fout}</div>
          ) : users.length === 0 ? (
            <div className="py-4 text-sm text-gray-500">Geen gebruikers gevonden.</div>
          ) : (
            <div className="space-y-2">
              {users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => onSelect(user)}
                  className="w-full rounded-xl border px-4 py-3 text-left hover:bg-gray-50"
                >
                  <div className="font-medium">{user.displayName}</div>
                  <div className="text-sm text-gray-500">
                    {user.mail || user.userPrincipalName || "-"}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end border-t px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border px-4 py-2 hover:bg-gray-50"
          >
            Sluiten
          </button>
        </div>
      </div>
    </div>
  );
}