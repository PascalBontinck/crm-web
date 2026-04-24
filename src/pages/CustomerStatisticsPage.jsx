import { Card, CardContent, CardHeader } from "../components/ui/Card";

export default function CustomerStatisticsPage({ customer }) {
  return (
    <Card>
      <CardHeader title="Statistieken" subtitle={`Statistiekenscherm van ${customer.name}`} />
      <CardContent>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-sm text-slate-600">
          Hier komen de statistieken van deze klant.
        </div>
      </CardContent>
    </Card>
  );
}