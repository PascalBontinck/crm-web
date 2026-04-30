import { useState } from "react";
import VerkopersBeheer from "../components/verkopers/VerkopersBeheer";
import CustomersBeheer from "../components/customers/CustomersBeheer";
import InvoicesBeheer from "../components/invoices/InvoicesBeheer";
import CustomerLocationsBeheer from "../components/customers/CustomerLocationsBeheer";
import { useNavigate } from "react-router-dom";
import ArtikelHistoriekBeheer from "../components/artikelhistoriek/ArtikelHistoriekBeheer";
import SalesRepGroupsAdmin from "../components/admin/SalesRepGroupsAdmin";

export default function AdminPage() {
  const [activeSection, setActiveSection] = useState(null);
  const navigate = useNavigate();

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
          onClick={() => navigate("/beheer/gebruikers")}
          className="rounded-xl border p-6 text-left transition bg-white hover:bg-gray-50"
        >
          <div className="mb-2 text-lg font-bold">Beheer gebruikers</div>
          <div className="text-sm text-gray-600">
            Beheer toegang, rollen en verkopercodes van gebruikers.
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

        <button
          onClick={() =>
            setActiveSection(
              activeSection === "salesRepGroups" ? null : "salesRepGroups"
            )
          }
          className={`rounded-xl border p-6 text-left transition ${
            activeSection === "salesRepGroups"
              ? "border-blue-500 bg-blue-50"
              : "bg-white hover:bg-gray-50"
          }`}
        >
          <div className="mb-2 text-lg font-bold">Vertegenwoordigersgroepen</div>
          <div className="text-sm text-gray-600">
            Groepeer verkoperscodes zoals ADV + TO* en KVB + TA*.
          </div>
        </button>

        <button
          onClick={() =>
            setActiveSection(
              activeSection === "artikelhistoriek" ? null : "artikelhistoriek"
            )
          }
          className={`rounded-xl border p-6 text-left transition ${
            activeSection === "artikelhistoriek"
              ? "border-blue-500 bg-blue-50"
              : "bg-white hover:bg-gray-50"
          }`}
        >
          <div className="mb-2 text-lg font-bold">Beheer artikelhistoriek</div>
          <div className="text-sm text-gray-600">
            Importeer artikelen en historieken uit Excel.
          </div>
        </button>        
      </div>

      {activeSection === "verkopers" && <VerkopersBeheer />}
      {activeSection === "klanten" && <CustomersBeheer />}
      {activeSection === "invoices" && <InvoicesBeheer />}
      {activeSection === "locations" && <CustomerLocationsBeheer />}
      {activeSection === "artikelhistoriek" && <ArtikelHistoriekBeheer />}
      {activeSection === "salesRepGroups" && <SalesRepGroupsAdmin />}
    </div>
  );
}