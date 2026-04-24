import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { useMsal } from "@azure/msal-react";
import { apiRequest } from "../authConfig";

function formatDateTime(value) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("nl-BE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function InputField({ label, children }) {
  return (
    <label className="block">
      <div className="mb-1 text-sm font-medium text-slate-700">{label}</div>
      {children}
    </label>
  );
}

export default function ReportsPage() {
  const { instance, accounts } = useMsal();
  const location = useLocation();

  const apiBase = import.meta.env.VITE_API_BASE_URL;
  const preselectedCustomerId = location.state?.customerId ?? null;

  const [searchTerm, setSearchTerm] = useState("");
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const [reports, setReports] = useState([]);
  const [selectedReportId, setSelectedReportId] = useState(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [mailTo, setMailTo] = useState("");
  const [mailCc, setMailCc] = useState("");
  const [mailSubject, setMailSubject] = useState("");

  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadingReports, setLoadingReports] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mailing, setMailing] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [verkopers, setVerkopers] = useState([]);
  const [selectedVerkoper, setSelectedVerkoper] = useState("");
  const [canChooseVerkoper, setCanChooseVerkoper] = useState(false);

  const selectedReport = useMemo(() => {
    return reports.find((r) => r.id === selectedReportId) ?? null;
  }, [reports, selectedReportId]);

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
        throw new Error("Backend gaf geen geldige JSON terug.");
      }
    }

    if (!response.ok) {
      throw new Error(
        data?.message ||
          data?.error ||
          data?.details ||
          `Aanvraag mislukt (status ${response.status}).`
      );
    }

    return data;
  }

  async function searchCustomers(term = "") {
    try {
      setLoadingCustomers(true);
      setError("");

      const result = await apiFetch(
        `/reports/customers?q=${encodeURIComponent(term)}&verkoper=${encodeURIComponent(selectedVerkoper)}`
      );

      const list = Array.isArray(result) ? result : [];
      setCustomers(list);
      return list;
    } catch (err) {
      setError(err.message || "Zoeken van klanten mislukt.");
      return [];
    } finally {
      setLoadingCustomers(false);
    }
  }

  async function loadReports(customerId) {
    if (!customerId) {
      setReports([]);
      setSelectedReportId(null);
      return;
    }

    try {
      setLoadingReports(true);
      setError("");

      const result = await apiFetch(
        `/reports?customerId=${customerId}&verkoper=${encodeURIComponent(selectedVerkoper)}`
      );

      const list = Array.isArray(result) ? result : [];
      setReports(list);

      if (list.length > 0) {
        const first = list[0];
        setSelectedReportId(first.id);
        setTitle(first.title ?? "");
        setDescription(first.description ?? "");
        setMailSubject(`Rapport - ${first.title ?? ""}`);
      } else {
        setSelectedReportId(null);
        setTitle("");
        setDescription("");
        setMailSubject(
          selectedCustomer?.klantNaam
            ? `Rapport - ${selectedCustomer.klantNaam}`
            : ""
        );
      }
    } catch (err) {
      setError(err.message || "Rapporten laden mislukt.");
    } finally {
      setLoadingReports(false);
    }
  }

  async function loadVerkopers() {
    try {
      const result = await apiFetch("/reports/verkopers");
      const list = Array.isArray(result) ? result : [];
      setVerkopers(list);
      setCanChooseVerkoper(list.length > 1);
    } catch (err) {
      setError(err.message || "Verkopers laden mislukt.");
    }
  }

  useEffect(() => {
    searchCustomers("");
    loadVerkopers();
  }, []);

  useEffect(() => {
    async function preloadCustomer() {
      if (!preselectedCustomerId) return;

      let found = customers.find((c) => c.id === preselectedCustomerId);

      if (!found) {
        const list = await searchCustomers("");
        found = list.find((c) => c.id === preselectedCustomerId);
      }

      if (found) {
        setSelectedCustomer(found);
      }
    }

    preloadCustomer();
  }, [preselectedCustomerId, customers]);

  useEffect(() => {
    if (!selectedCustomer?.id) return;

    loadReports(selectedCustomer.id);
    setMailTo(selectedCustomer.mail ?? "");
  }, [selectedCustomer]);

  useEffect(() => {
    if (!selectedReport) return;

    setTitle(selectedReport.title ?? "");
    setDescription(selectedReport.description ?? "");
    setMailSubject(`Rapport - ${selectedReport.title ?? ""}`);
  }, [selectedReport]);

  useEffect(() => {
    setSelectedCustomer(null);
    setReports([]);
    setSelectedReportId(null);
    setTitle("");
    setDescription("");
    setMessage("");
    searchCustomers(searchTerm);
  }, [selectedVerkoper]);

  function handleNewReport() {
    setSelectedReportId(null);
    setTitle("");
    setDescription("");
    setMessage("");
    setError("");

    if (selectedCustomer?.klantNaam) {
      setMailSubject(`Rapport - ${selectedCustomer.klantNaam}`);
    } else {
      setMailSubject("");
    }
  }

  async function handleSave() {
    if (!selectedCustomer?.id) {
      setError("Selecteer eerst een klant.");
      return;
    }

    if (!title.trim()) {
      setError("Titel is verplicht.");
      return;
    }

    try {
      setSaving(true);
      setMessage("");
      setError("");

      if (selectedReportId) {
        await apiFetch(`/reports/${selectedReportId}`, {
          method: "PUT",
          body: JSON.stringify({
            title: title.trim(),
            description: description.trim(),
          }),
        });

        setMessage("Rapport aangepast.");
      } else {
        await apiFetch(`/reports`, {
          method: "POST",
          body: JSON.stringify({
            customerId: selectedCustomer.id,
            title: title.trim(),
            description: description.trim(),
          }),
        });

        setMessage("Rapport aangemaakt.");
      }

      await loadReports(selectedCustomer.id);
    } catch (err) {
      setError(err.message || "Opslaan mislukt.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!selectedReportId || !selectedCustomer?.id) return;

    const confirmed = window.confirm("Wil je dit rapport zeker verwijderen?");
    if (!confirmed) return;

    try {
      setMessage("");
      setError("");

      await apiFetch(`/reports/${selectedReportId}`, {
        method: "DELETE",
      });

      setMessage("Rapport verwijderd.");
      await loadReports(selectedCustomer.id);
    } catch (err) {
      setError(err.message || "Verwijderen mislukt.");
    }
  }

  async function handleDownloadPdf() {
    if (!selectedReportId) {
      setError("Selecteer eerst een rapport.");
      return;
    }

    try {
      setError("");
      const accessToken = await getAccessToken();

      const response = await fetch(`${apiBase}/reports/${selectedReportId}/pdf`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("PDF downloaden mislukt.");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `rapport-${selectedReportId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message || "PDF downloaden mislukt.");
    }
  }

  async function handleMail() {
    if (!selectedReportId) {
      setError("Selecteer eerst een rapport.");
      return;
    }

    if (!mailTo.trim()) {
      setError("Ontvanger is verplicht.");
      return;
    }

    try {
      setMailing(true);
      setMessage("");
      setError("");

      await apiFetch(`/reports/${selectedReportId}/mail`, {
        method: "POST",
        body: JSON.stringify({
          to: mailTo.trim(),
          cc: mailCc.trim(),
          subject: mailSubject.trim(),
        }),
      });

      setMessage("Rapport verzonden per e-mail met PDF-bijlage.");
    } catch (err) {
      setError(err.message || "Mailen mislukt.");
    } finally {
      setMailing(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-2">
          <h1 className="text-2xl font-bold text-slate-900">Rapportage</h1>
          <p className="text-sm text-slate-500">
            Maak nieuwe rapporten aan, wijzig bestaande rapporten, exporteer ze als PDF of mail ze door.
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-slate-900">Klanten</h2>
            <button
              onClick={() => searchCustomers(searchTerm)}
              className="rounded-lg bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-800"
            >
              Zoeken
            </button>
          </div>

          {canChooseVerkoper ? (
            <div className="mb-4">
              <InputField label="Vertegenwoordiger">
                <select
                  value={selectedVerkoper}
                  onChange={(e) => setSelectedVerkoper(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-900"
                >
                  <option value="">Alle vertegenwoordigers</option>
                  {verkopers.map((verkoper) => (
                    <option key={verkoper.code} value={verkoper.code}>
                      {verkoper.code}
                      {verkoper.naam ? ` - ${verkoper.naam}` : ""}
                    </option>
                  ))}
                </select>
              </InputField>
            </div>
          ) : null}

          <InputField label="Zoek op klantnaam, klantnummer of gemeente">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  searchCustomers(searchTerm);
                }
              }}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-900"
            />
          </InputField>

          <div className="mt-4 max-h-[550px] overflow-auto rounded-xl border border-slate-200">
            {loadingCustomers ? (
              <div className="p-4 text-sm text-slate-500">Klanten laden...</div>
            ) : customers.length === 0 ? (
              <div className="p-4 text-sm text-slate-500">Geen klanten gevonden.</div>
            ) : (
              customers.map((customer) => {
                const active = selectedCustomer?.id === customer.id;

                return (
                  <button
                    key={customer.id}
                    onClick={() => setSelectedCustomer(customer)}
                    className={`block w-full border-b border-slate-200 px-4 py-3 text-left last:border-b-0 ${
                      active
                        ? "bg-slate-900 text-white"
                        : "bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div className="font-semibold">{customer.klantNaam}</div>
                    <div className={`text-sm ${active ? "text-slate-200" : "text-slate-500"}`}>
                      #{customer.klantnr} · {customer.klantGemeente || "-"}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Rapporten</h2>
                <p className="text-sm text-slate-500">
                  {selectedCustomer
                    ? `${selectedCustomer.klantNaam} (#${selectedCustomer.klantnr})`
                    : "Selecteer eerst een klant"}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleNewReport}
                  disabled={!selectedCustomer}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Nieuw rapport
                </button>

                <button
                  onClick={handleSave}
                  disabled={!selectedCustomer || saving}
                  className="rounded-lg bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? "Opslaan..." : "Opslaan"}
                </button>

                <button
                  onClick={handleDelete}
                  disabled={!selectedReportId}
                  className="rounded-lg border border-red-300 px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Verwijderen
                </button>

                <button
                  onClick={handleDownloadPdf}
                  disabled={!selectedReportId}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  PDF exporteren
                </button>
              </div>
            </div>

            {message ? (
              <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                {message}
              </div>
            ) : null}

            {error ? (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <div className="grid gap-6 xl:grid-cols-[300px_1fr]">
              <div>
                <div className="mb-2 text-sm font-medium text-slate-700">
                  Bestaande rapporten
                </div>

                <div className="max-h-[480px] overflow-auto rounded-xl border border-slate-200">
                  {loadingReports ? (
                    <div className="p-4 text-sm text-slate-500">Rapporten laden...</div>
                  ) : reports.length === 0 ? (
                    <div className="p-4 text-sm text-slate-500">Nog geen rapporten voor deze klant.</div>
                  ) : (
                    reports.map((report) => {
                      const active = selectedReportId === report.id;

                      return (
                        <button
                          key={report.id}
                          onClick={() => setSelectedReportId(report.id)}
                          className={`block w-full border-b border-slate-200 px-4 py-3 text-left last:border-b-0 ${
                            active
                              ? "bg-slate-900 text-white"
                              : "bg-white hover:bg-slate-50"
                          }`}
                        >
                          <div className="font-semibold">{report.title}</div>
                          <div className={`text-xs ${active ? "text-slate-200" : "text-slate-500"}`}>
                            {report.verkopercode ? `${report.verkopercode} · ` : ""}
                            Gewijzigd op {formatDateTime(report.updatedAt)}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <InputField label="Titel">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={!selectedCustomer}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-900 disabled:bg-slate-100"
                  />
                </InputField>

                <InputField label="Uitgebreide omschrijving">
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={14}
                    disabled={!selectedCustomer}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-900 disabled:bg-slate-100"
                  />
                </InputField>

                {selectedReport ? (
                  <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm md:grid-cols-2">
                    <div>
                      <div className="font-semibold text-slate-700">Aangemaakt op</div>
                      <div>{formatDateTime(selectedReport.createdAt)}</div>
                    </div>

                    <div>
                      <div className="font-semibold text-slate-700">Gewijzigd op</div>
                      <div>{formatDateTime(selectedReport.updatedAt)}</div>
                    </div>

                    <div>
                      <div className="font-semibold text-slate-700">Aangemaakt door</div>
                      <div>{selectedReport.createdByName || "-"}</div>
                    </div>

                    <div>
                      <div className="font-semibold text-slate-700">Gewijzigd door</div>
                      <div>{selectedReport.updatedByName || "-"}</div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Rapport mailen</h2>
              <p className="text-sm text-slate-500">
                Dit verstuurt een begeleidende e-mail met het rapport als PDF-bijlage.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <InputField label="Aan">
                <input
                  type="text"
                  value={mailTo}
                  onChange={(e) => setMailTo(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-900"
                />
              </InputField>

              <InputField label="CC">
                <input
                  type="text"
                  value={mailCc}
                  onChange={(e) => setMailCc(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-900"
                />
              </InputField>
            </div>

            <div className="mt-4">
              <InputField label="Onderwerp">
                <input
                  type="text"
                  value={mailSubject}
                  onChange={(e) => setMailSubject(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-900"
                />
              </InputField>
            </div>

            <div className="mt-4">
              <button
                onClick={handleMail}
                disabled={!selectedReportId || mailing}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {mailing ? "Verzenden..." : "Mail rapport"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}