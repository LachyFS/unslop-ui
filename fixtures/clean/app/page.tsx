export default function Page() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <section className="grid gap-8 md:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <p className="text-sm font-medium text-primary">Release review</p>
          <h1 className="text-4xl font-semibold tracking-tight text-foreground">
            Review interface drift before merge
          </h1>
          <p className="max-w-2xl text-base leading-7 text-foreground">
            The report highlights repeated styling choices, skipped tokens, and layout debt that
            reviewers can act on quickly.
          </p>
        </div>
        <aside className="rounded-lg border border-border bg-card p-5">
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="font-medium text-foreground">Files</dt>
              <dd className="text-muted-foreground">42 scanned</dd>
            </div>
            <div>
              <dt className="font-medium text-foreground">Status</dt>
              <dd className="text-muted-foreground">Ready</dd>
            </div>
          </dl>
        </aside>
      </section>
    </main>
  );
}
