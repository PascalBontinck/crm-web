export default function PageHeader({ title, currentUser }) {
  return (
    <div className="mb-6 flex w-full flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">{title}</h1>
        <p className="mt-1 text-sm text-slate-600">
          Aangemeld als {currentUser.name} ({currentUser.role})
        </p>
      </div>

      <div className="flex w-full flex-col gap-3 sm:flex-row xl:w-auto">
        <input
          type="text"
          placeholder="Zoek klant, deal of verkoper..."
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm outline-none focus:border-slate-500 xl:w-[340px]"
        />
        <button className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-100">
          Filters
        </button>
        <button className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
          Nieuw rapport
        </button>
      </div>
    </div>
  );
}