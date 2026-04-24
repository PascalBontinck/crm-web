import { Card, CardContent, CardHeader } from "../ui/Card";

export default function CustomerNoteForm({
  noteText,
  setNoteText,
  onSubmit,
  noteSubmitting,
  noteStatus,
}) {
  return (
    <Card>
      <CardHeader
        title="Opmerking"
        subtitle="Na verzenden wordt een mail gestuurd naar info@toch.be."
      />
      <CardContent>
        <div className="space-y-4">
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            rows={6}
            placeholder="Typ hier je opmerking voor deze klant..."
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500"
          />

          {noteStatus ? (
            <div
              className={`rounded-xl border p-4 text-sm ${
                noteStatus.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {noteStatus.message}
            </div>
          ) : null}

          <div className="flex justify-end">
            <button
              onClick={onSubmit}
              disabled={noteSubmitting || !noteText.trim()}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {noteSubmitting ? "Bezig met verzenden..." : "Opmerking verzenden"}
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}