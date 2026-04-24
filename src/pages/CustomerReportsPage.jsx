import { Card, CardContent, CardHeader } from "../components/ui/Card";

export default function CustomerReportsPage({ customer }) {
  return (
    <Card>
      <CardHeader title="Rapporten" subtitle={`Rapportenscherm van ${customer.name}`} />
      <CardContent>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-sm text-slate-600">
          Hier komt het rapportenscherm van deze klant.
        </div>
      </CardContent>
    </Card>
  );
}