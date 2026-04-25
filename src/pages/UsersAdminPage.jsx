import { useEffect, useState } from "react";
import { useMsal } from "@azure/msal-react";
import { apiRequest } from "../authConfig";

const emptyForm = {
  id: null,
  displayName: "",
  email: "",
  azureAdObjectId: "",
  verkoperCode: "",
  scopeType: "Self",
};

export default function UsersAdminPage() {
  const { instance, accounts } = useMsal();

  const apiBase = import.meta.env.VITE_API_BASE_URL;

  const [users, setUsers] = useState([]);
  const [verkopers, setVerkopers] = useState([]);
  const [form, setForm] = useState(emptyForm);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function getAccessToken() {
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
  }

  async function apiFetch(path, options = {}) {
    const accessToken = await getAccessToken();

    const response = await fetch(`${apiBase}${path}`, {
      ...options,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(options.headers || {}),
      },
    });

    const rawText = await response.text();

    let data = null;

    if (rawText) {
      try {
        data = JSON.parse(rawText);
      } catch {
        throw new Error(rawText);
      }
    }

    if (!response.ok) {
      throw new Error(
        data?.message ||
          data?.error ||
          data?.details ||
          rawText ||
          `Aanvraag mislukt met status ${response.status}.`
      );
    }

    return data;
  }

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [usersResult, verkopersResult] = await Promise.all([
        apiFetch("/appusers"),
        apiFetch("/appusers/verkopers"),
      ]);

      setUsers(Array.isArray(usersResult) ? usersResult : []);
      setVerkopers(Array.isArray(verkopersResult) ? verkopersResult : []);
    } catch (err) {
      setError(err.message || "Gebruikers laden mislukt.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function editUser(user) {
    setMessage("");
    setError("");

    setForm({
      id: user.id,
      displayName: user.displayName ?? "",
      email: user.email ?? "",
      azureAdObjectId: user.azureAdObjectId ?? "",
      verkoperCode: user.verkoperCode ?? "",
      scopeType: user.scopeType || "Self",
    });
  }

  function newUser() {
    setMessage("");
    setError("");
    setForm(emptyForm);
  }

  async function saveUser() {
    try {
      setSaving(true);
      setMessage("");
      setError("");

      const payload = {
        displayName: form.displayName.trim(),
        email: form.email.trim(),
        azureAdObjectId: form.azureAdObjectId.trim(),
        verkoperCode: form.verkoperCode.trim(),
        scopeType: form.scopeType,
      };

      if (form.id) {
        await apiFetch(`/appusers/${form.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });

        setMessage("Gebruiker aangepast.");
      } else {
        await apiFetch("/appusers", {
          method: "POST",
          body: JSON.stringify(payload),
        });

        setMessage("Gebruiker aangemaakt.");
      }

      setForm(emptyForm);
      await loadData();
    } catch (err) {
      setError(err.message || "Opslaan mislukt.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteUser(user) {
    const confirmed = window.confirm(
      `Wil je gebruiker "${user.displayName}" verwijderen?`
    );

    if (!confirmed) return;

    try {
      setMessage("");
      setError("");

      await apiFetch(`/appusers/${user.id}`, {
        method: "DELETE",
      });

      setMessage("Gebruiker verwijderd.");
      await loadData();

      if (form.id === user.id) {
        setForm(emptyForm);
      }
    } catch (err) {
      setError(err.message || "Verwijderen mislukt.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-white p-6">
        <h2 className="mb-2 text-xl font-bold">Gebruikers beheren</h2>
        <p className="text-sm text-gray-600">
          Beheer toegang, rollen en verkopercodes.
        </p>
      </div>

      {message ? (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 whitespace-pre-wrap">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <div className="rounded-xl border bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold">Gebruikers</h3>
            <button
              onClick={loadData}
              className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
            >
              Vernieuwen
            </button>
          </div>

          {loading ? (
            <div className="text-sm text-gray-500">Gebruikers laden...</div>
          ) : users.length === 0 ? (
            <div className="text-sm text-gray-500">Geen gebruikers gevonden.</div>
          ) : (
            <div className="overflow-auto rounded-xl border">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-left">
                  <tr>
                    <th className="px-4 py-3">Naam</th>
                    <th className="px-4 py-3">E-mail</th>
                    <th className="px-4 py-3">Scope</th>
                    <th className="px-4 py-3">Verkoper</th>
                    <th className="px-4 py-3 text-right">Acties</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-t">
                      <td className="px-4 py-3 font-medium">
                        {user.displayName}
                      </td>
                      <td className="px-4 py-3">{user.email}</td>
                      <td className="px-4 py-3">{user.scopeType || "-"}</td>
                      <td className="px-4 py-3">{user.verkoperCode || "-"}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => editUser(user)}
                            className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
                          >
                            Bewerken
                          </button>
                          <button
                            onClick={() => deleteUser(user)}
                            className="rounded-lg border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                          >
                            Verwijderen
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="rounded-xl border bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold">
              {form.id ? "Gebruiker aanpassen" : "Nieuwe gebruiker"}
            </h3>
            <button
              onClick={newUser}
              className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
            >
              Nieuw
            </button>
          </div>

          <div className="space-y-4">
            <label className="block">
              <div className="mb-1 text-sm font-medium text-gray-700">Naam</div>
              <input
                value={form.displayName}
                onChange={(e) =>
                  setForm({ ...form, displayName: e.target.value })
                }
                className="w-full rounded-lg border px-3 py-2 outline-none focus:border-slate-900"
              />
            </label>

            <label className="block">
              <div className="mb-1 text-sm font-medium text-gray-700">
                E-mail
              </div>
              <input
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 outline-none focus:border-slate-900"
              />
            </label>

            <label className="block">
              <div className="mb-1 text-sm font-medium text-gray-700">
                Azure Object ID
              </div>
              <input
                value={form.azureAdObjectId}
                onChange={(e) =>
                  setForm({ ...form, azureAdObjectId: e.target.value })
                }
                className="w-full rounded-lg border px-3 py-2 outline-none focus:border-slate-900"
              />
              <div className="mt-1 text-xs text-gray-500">
                Te vinden in Microsoft Entra ID bij de gebruiker.
              </div>
            </label>

            <label className="block">
              <div className="mb-1 text-sm font-medium text-gray-700">
                Scope
              </div>
              <select
                value={form.scopeType}
                onChange={(e) =>
                  setForm({ ...form, scopeType: e.target.value })
                }
                className="w-full rounded-lg border px-3 py-2 outline-none focus:border-slate-900"
              >
                <option value="Self">Self - enkel eigen klanten</option>
                <option value="Manager">Manager - alle verkopers selecteerbaar</option>
                <option value="All">All - volledige toegang</option>
              </select>
            </label>

            <label className="block">
              <div className="mb-1 text-sm font-medium text-gray-700">
                VerkoperCode
              </div>
              <input
                value={form.verkoperCode}
                onChange={(e) =>
                  setForm({ ...form, verkoperCode: e.target.value })
                }
                placeholder="Bijv. CLE;ABC;XYZ"
                className="w-full rounded-lg border px-3 py-2 outline-none focus:border-slate-900"
              />

              <div className="mt-1 text-xs text-gray-500">
                Meerdere verkopercodes scheiden met puntkomma, bv. CLE;ABC;XYZ.
              </div>
              <div className="mt-1 text-xs text-gray-500">
                Alleen nodig voor gebruikers met scope Self.
              </div>
            </label>

            <button
              onClick={saveUser}
              disabled={saving}
              className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {saving ? "Opslaan..." : "Opslaan"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}