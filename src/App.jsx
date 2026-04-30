import { useEffect, useMemo, useState } from "react";
import { useMsal } from "@azure/msal-react";
import { loginRequest, apiRequest } from "./authConfig";
import { Routes, Route, Link, useLocation, Navigate } from "react-router-dom";

import CustomersPage from "./pages/CustomersPage";
import CustomerDetail from "./pages/CustomerDetail";
import DashboardPage from "./pages/DashboardPage";
import ProductsPage from "./pages/ProductsPage";
import ReportsPage from "./pages/ReportsPage";
import SettingsPage from "./pages/SettingsPage";
import AdminPage from "./pages/AdminPage";
import UsersAdminPage from "./pages/UsersAdminPage";
import ArtikelBeheerPage from "./pages/ArtikelBeheerPage";
import ArtikelDashboardPage from "./pages/ArtikelDashboardPage";
import ArtikelKopersAnalysePage from "./pages/ArtikelKopersAnalysePage";

import logo from "./assets/logo.png";

export default function App() {
  const { instance, accounts } = useMsal();
  const activeAccount = instance.getActiveAccount() || accounts[0];
  const location = useLocation();

  const apiBase = import.meta.env.VITE_API_BASE_URL;

  const [crmRole, setCrmRole] = useState("");
  const [profilePhotoUrl, setProfilePhotoUrl] = useState("");

  const canUseAdmin = crmRole === "All" || crmRole === "Manager";

  const initials = useMemo(() => {
    if (!activeAccount?.name) return "?";
    return activeAccount.name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [activeAccount]);

  useEffect(() => {
    async function loadScope() {
      if (!accounts.length) return;

      try {
        const tokenResponse = await instance.acquireTokenSilent({
          ...apiRequest,
          account: accounts[0],
        });

        const response = await fetch(`${apiBase}/dashboard/filter-options`, {
          headers: {
            Authorization: `Bearer ${tokenResponse.accessToken}`,
          },
        });

        if (!response.ok) {
          setCrmRole("");
          return;
        }

        const data = await response.json();
        setCrmRole(data.scopeType ?? "");
      } catch (error) {
        console.error("CRM rol laden mislukt:", error);
        setCrmRole("");
      }
    }

    loadScope();
  }, [accounts, instance, apiBase]);

  useEffect(() => {
    const loadProfilePhoto = async () => {
      if (!accounts.length) return;

      try {
        const tokenResponse = await instance.acquireTokenSilent({
          scopes: ["User.Read"],
          account: accounts[0],
        });

        const response = await fetch(
          "https://graph.microsoft.com/v1.0/me/photo/$value",
          {
            headers: {
              Authorization: `Bearer ${tokenResponse.accessToken}`,
            },
          }
        );

        if (!response.ok) {
          setProfilePhotoUrl("");
          return;
        }

        const blob = await response.blob();
        const imageUrl = URL.createObjectURL(blob);
        setProfilePhotoUrl(imageUrl);
      } catch (error) {
        console.error("Profielfoto laden mislukt:", error);
        setProfilePhotoUrl("");
      }
    };

    loadProfilePhoto();
  }, [accounts, instance]);

  const handleLogin = async () => {
    await instance.loginRedirect(loginRequest);
  };

  const handleLogout = async () => {
    await instance.logoutRedirect({
      postLogoutRedirectUri: window.location.origin,
    });
  };

  if (!activeAccount) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <button
          onClick={handleLogin}
          className="rounded-xl bg-slate-900 px-6 py-3 text-white"
        >
          Inloggen met Microsoft
        </button>
      </div>
    );
  }

  const menuItems = [
    { to: "/", label: "Dashboard", show: true },
    { to: "/customers", label: "Klanten", show: true },
    { to: "/artikelbeheer", label: "Artikelbeheer", show: true },
    { to: "/artikel-dashboard", label: "Artikel dashboard", show: true },
    { to: "/artikel-kopersanalyse", label: "Kopersanalyse", show: true },
    { to: "/reports", label: "Rapporten", show: true },
    { to: "/settings", label: "Instellingen", show: true },
    { to: "/admin", label: "Beheer", show: canUseAdmin },
  ];

  const getPageTitle = () => {
    if (location.pathname.startsWith("/customers/")) return "Klantenfiche";
    if (location.pathname === "/beheer/gebruikers") return "Gebruikers beheren";

    const current = menuItems.find((item) => item.to === location.pathname);
    return current?.label || "CRM";
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="flex w-64 flex-col border-r border-slate-200 bg-white p-6">
        <div className="mb-8 flex items-center gap-3">
          <img src={logo} alt="Logo" className="h-10 w-auto object-contain" />
          <div className="text-xl font-bold text-slate-900">CRM</div>
        </div>

        <nav className="flex-1 space-y-2">
          {menuItems
            .filter((item) => item.show)
            .map((item) => {
              const isActive =
                location.pathname === item.to ||
                (item.to === "/customers" &&
                  location.pathname.startsWith("/customers/"));

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`block rounded-xl px-3 py-2 transition ${
                    isActive
                      ? "bg-slate-900 text-white"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
        </nav>

        <button
          onClick={handleLogout}
          className="mt-6 rounded-xl border border-slate-300 bg-white px-4 py-2 text-left text-slate-700 hover:bg-slate-100"
        >
          Uitloggen
        </button>
      </aside>

      <main className="flex-1 p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {getPageTitle()}
            </h1>
            <div className="mt-1 text-sm text-slate-500">
              {activeAccount.name} · {activeAccount.username}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm font-medium text-slate-900">
                {activeAccount.name}
              </div>
              <div className="text-xs text-slate-500">
                {crmRole || "Geen rol"}
              </div>
            </div>

            {profilePhotoUrl ? (
              <img
                src={profilePhotoUrl}
                alt="Profielfoto"
                className="h-12 w-12 rounded-full border border-slate-200 object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
                {initials}
              </div>
            )}
          </div>
        </div>

        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/customers/:id" element={<CustomerDetail />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/artikelbeheer" element={<ArtikelBeheerPage />} />
          <Route path="/artikel-dashboard" element={<ArtikelDashboardPage />} />

          <Route
            path="/artikel-kopersanalyse"
            element={<ArtikelKopersAnalysePage />}
          />
          
          <Route
            path="/admin"
            element={canUseAdmin ? <AdminPage /> : <Navigate to="/" replace />}
          />

          <Route
            path="/beheer/gebruikers"
            element={
              canUseAdmin ? <UsersAdminPage /> : <Navigate to="/" replace />
            }
          />
        </Routes>
      </main>
    </div>
  );
}