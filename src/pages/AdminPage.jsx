import { useState } from "react";
import VerkopersBeheer from "../components/verkopers/VerkopersBeheer";
import CustomersBeheer from "../components/customers/CustomersBeheer";
import InvoicesBeheer from "../components/invoices/InvoicesBeheer";
import CustomerLocationsBeheer from "../components/customers/CustomerLocationsBeheer";

export default function AdminPage() {
  const [activeSection, setActiveSection] = useState(null);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-white p-6">
        <h2 className="mb-2 text-xl font-bold">Beheer</h2>
        <p className="text-sm text-gray-600">
          Kies hieronder welk onderdeel je wilt beheren.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <button
          onClick={() =>
            setActiveSection(activeSection === "verkopers" ? null : "verkopers")
          }
          className={`rounded-xl border p-6 text-left transition ${
            activeSection === "verkopers"
              ? "border-blue-500 bg-blue-50"
              : "bg-white hover:bg-gray-50"
          }`}
        >
          <div className="mb-2 text-lg font-bold">Beheer verkopers</div>
          <div className="text-sm text-gray-600">
            Importeer verkopers en koppel ze aan Microsoft 365-gebruikers.
          </div>
        </button>

        <button
          onClick={() =>
            setActiveSection(activeSection === "klanten" ? null : "klanten")
          }
          className={`rounded-xl border p-6 text-left transition ${
            activeSection === "klanten"
              ? "border-blue-500 bg-blue-50"
              : "bg-white hover:bg-gray-50"
          }`}
        >
          <div className="mb-2 text-lg font-bold">Beheer klanten</div>
          <div className="text-sm text-gray-600">
            Importeer klanten uit Klanten.xlsx en Klanten2.xlsx.
          </div>
        </button>

        <button
          onClick={() =>
            setActiveSection(activeSection === "invoices" ? null : "invoices")
          }
          className={`rounded-xl border p-6 text-left transition ${
            activeSection === "invoices"
              ? "border-blue-500 bg-blue-50"
              : "bg-white hover:bg-gray-50"
          }`}
        >
          <div className="mb-2 text-lg font-bold">Beheer facturen / omzet</div>
          <div className="text-sm text-gray-600">
            Importeer omzetgegevens uit Omzet.xlsx.
          </div>
        </button>

        <button
          onClick={() =>
            setActiveSection(activeSection === "locations" ? null : "locations")
          }
          className={`rounded-xl border p-6 text-left transition ${
            activeSection === "locations"
              ? "border-blue-500 bg-blue-50"
              : "bg-white hover:bg-gray-50"
          }`}
        >
          <div className="mb-2 text-lg font-bold">Beheer klantlocaties</div>
          <div className="text-sm text-gray-600">
            Vul automatisch locaties in voor klanten zonder coördinaten.
          </div>
        </button>
      </div>

      {activeSection === "verkopers" && <VerkopersBeheer />}
      {activeSection === "klanten" && <CustomersBeheer />}
      {activeSection === "invoices" && <InvoicesBeheer />}
      {activeSection === "locations" && <CustomerLocationsBeheer />}
    </div>
  );
}