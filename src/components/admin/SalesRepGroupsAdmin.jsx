import { useEffect, useState } from "react";
import { useMsal } from "@azure/msal-react";
import { apiRequest } from "../../authConfig";

export default function SalesRepGroupsAdmin() {
  const { instance, accounts } = useMsal();
  const apiBase = import.meta.env.VITE_API_BASE_URL;

  const [rules, setRules] = useState([]);
  const [melding, setMelding] = useState("");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    id: null,
    groupCode: "",
    groupName: "",
    matchType: "Exact",
    matchValue: "",
    isActive: true,
  });

  const getToken = async () => {
    const response = await instance.acquireTokenSilent({
      ...apiRequest,
      account: accounts[0],
    });

    return response.accessToken;
  };

  const apiFetch = async (url, options = {}) => {
    const token = await getToken();

    const res = await fetch(`${apiBase}${url}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });

    const text = await res.text();
    let data = null;

    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }

    if (!res.ok) {
      throw new Error(data?.message || data || "API fout");
    }

    return data;
  };

  const loadRules = async () => {
    const data = await apiFetch("/sales-rep-groups");
    setRules(Array.isArray(data) ? data : []);
  };

  const resetForm = () => {
    setForm({
      id: null,
      groupCode: "",
      groupName: "",
      matchType: "Exact",
      matchValue: "",
      isActive: true,
    });
  };

  const saveRule = async () => {
    try {
      setLoading(true);
      setMelding("");

      const payload = {
        groupCode: form.groupCode,
        groupName: form.groupName,
        matchType: form.matchType,
        matchValue: form.matchValue,
        isActive: form.isActive,
      };

      if (form.id) {
        await apiFetch(`/sales-rep-groups/${form.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch("/sales-rep-groups", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      resetForm();
      await loadRules();
      setMelding("Vertegenwoordigersgroep opgeslagen.");
    } catch (err) {
      setMelding(err.message || "Opslaan mislukt.");
    } finally {
      setLoading(false);
    }
  };

  const editRule = (rule) => {
    setForm({
      id: rule.id,
      groupCode: rule.groupCode || "",
      groupName: rule.groupName || "",
      matchType: rule.matchType || "Exact",
      matchValue: rule.matchValue || "",
      isActive: Boolean(rule.isActive),
    });
  };

  const deleteRule = async (rule) => {
    if (!confirm(`Regel verwijderen: ${rule.groupCode} - ${rule.matchValue}?`)) {
      return;
    }

    try {
      setLoading(true);
      setMelding("");

      await apiFetch(`/sales-rep-groups/${rule.id}`, {
        method: "DELETE",
      });

      await loadRules();
      setMelding("Regel verwijderd.");
    } catch (err) {
      setMelding(err.message || "Verwijderen mislukt.");
    } finally {
      setLoading(false);
    }
  };

  const seedDefaults = async () => {
    try {
      setLoading(true);
      setMelding("");

      await apiFetch("/sales-rep-groups/seed-defaults", {
        method: "POST",
      });

      await loadRules();
      setMelding("Standaardregels toegevoegd.");
    } catch (err) {
      setMelding(err.message || "Standaardregels toevoegen mislukt.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accounts.length > 0) {
      loadRules();
    }
  }, [accounts]);

  return (
    <div className="space-y-5 rounded-xl border bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Beheer vertegenwoordigersgroepen</h2>
          <p className="text-sm text-slate-500">
            Groepeer verkoperscodes via exacte match of prefix, bv. ADV + TO*.
          </p>
        </div>

        <button
          onClick={seedDefaults}
          disabled={loading}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100 disabled:opacity-50"
        >
          Standaardregels toevoegen
        </button>
      </div>

      {melding && (
        <div className="rounded-lg bg-slate-100 px-3 py-2 text-sm">
          {melding}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
        <input
          value={form.groupCode}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, groupCode: e.target.value }))
          }
          placeholder="Groepcode bv. ADV"
          className="rounded-lg border px-3 py-2 text-sm"
        />

        <input
          value={form.groupName}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, groupName: e.target.value }))
          }
          placeholder="Groepnaam bv. ADV + TO"
          className="rounded-lg border px-3 py-2 text-sm"
        />

        <select
          value={form.matchType}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, matchType: e.target.value }))
          }
          className="rounded-lg border px-3 py-2 text-sm"
        >
          <option value="Exact">Exact</option>
          <option value="Prefix">Begint met</option>
        </select>

        <input
          value={form.matchValue}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, matchValue: e.target.value }))
          }
          placeholder="Waarde bv. TO"
          className="rounded-lg border px-3 py-2 text-sm"
        />

        <label className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, isActive: e.target.checked }))
            }
          />
          Actief
        </label>
      </div>

      <div className="flex gap-2">
        <button
          onClick={saveRule}
          disabled={loading}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {form.id ? "Wijziging opslaan" : "Regel toevoegen"}
        </button>

        {form.id && (
          <button
            onClick={resetForm}
            disabled={loading}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100 disabled:opacity-50"
          >
            Annuleren
          </button>
        )}
      </div>

      <div className="overflow-auto rounded-lg border">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50">
            <tr className="border-b text-left">
              <th className="px-3 py-2">Groepcode</th>
              <th className="px-3 py-2">Groepnaam</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Waarde</th>
              <th className="px-3 py-2">Actief</th>
              <th className="px-3 py-2 text-right">Acties</th>
            </tr>
          </thead>

          <tbody>
            {rules.map((rule, index) => (
              <tr
                key={rule.id}
                className={`border-b ${
                  index % 2 === 0 ? "bg-white" : "bg-slate-50"
                }`}
              >
                <td className="px-3 py-2 font-semibold">{rule.groupCode}</td>
                <td className="px-3 py-2">{rule.groupName}</td>
                <td className="px-3 py-2">
                  {rule.matchType === "Prefix" ? "Begint met" : "Exact"}
                </td>
                <td className="px-3 py-2">{rule.matchValue}</td>
                <td className="px-3 py-2">
                  {rule.isActive ? (
                    <span className="text-green-700">Ja</span>
                  ) : (
                    <span className="text-red-700">Nee</span>
                  )}
                </td>
                <td className="px-3 py-2 text-right">
                  <button
                    onClick={() => editRule(rule)}
                    className="mr-2 rounded-lg border px-3 py-1 hover:bg-slate-100"
                  >
                    Wijzig
                  </button>
                  <button
                    onClick={() => deleteRule(rule)}
                    className="rounded-lg border border-red-300 px-3 py-1 text-red-700 hover:bg-red-50"
                  >
                    Verwijder
                  </button>
                </td>
              </tr>
            ))}

            {rules.length === 0 && (
              <tr>
                <td colSpan="6" className="px-3 py-6 text-center text-slate-500">
                  Nog geen regels.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}