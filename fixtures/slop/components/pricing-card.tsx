export function PricingCard() {
  return (
    <article className="rounded-[21px] border border-slate-200 bg-white p-[23px] shadow-xl">
      <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
        <p className="text-sm text-muted-foreground">Starter</p>
        <h2 className="text-3xl font-semibold text-gray-900">$19</h2>
        <p className="text-muted-foreground">For modern AI-powered teams.</p>
      </div>
    </article>
  );
}
