import logo from "../../assets/logo.png";

export default function Sidebar({ items, activePage, onNavigate }) {
  return (
    <aside className="flex min-h-screen w-full max-w-[280px] flex-col border-r border-slate-200 bg-white px-4 py-5">
      <div className="mb-8 flex items-center gap-3 px-2">
        <img src={logo} alt="Logo" className="h-11 w-auto object-contain" />
        <div>
          <div className="text-lg font-semibold text-slate-900">CRM</div>
          <div className="text-xs text-slate-500">Verkoop & rapportage</div>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {items
          .filter((item) => item.visible)
          .map((item) => (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              className={`flex w-full items-center rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
                activePage === item.key
                  ? "bg-slate-900 text-white"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              {item.label}
            </button>
          ))}
      </nav>

      <div className="border-t border-slate-200 pt-4">
        <button className="flex w-full items-center rounded-xl px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100">
          Uitloggen
        </button>
      </div>
    </aside>
  );
}