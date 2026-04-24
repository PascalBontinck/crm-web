export default function CustomerDetailTabs({ activeTab, onChange }) {
  const tabs = [
    { key: "detail", label: "Klantenfiche" },
    { key: "reports", label: "Rapporten" },
    { key: "stats", label: "Statistieken" },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`rounded-xl px-4 py-2 text-sm font-medium ${
            activeTab === tab.key
              ? "bg-slate-900 text-white"
              : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}