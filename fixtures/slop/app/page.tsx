import { Sparkles, Zap, Rocket } from "lucide-react";

export default function Page() {
  return (
    <main className="min-h-screen bg-[#f7f8ff] text-[#111827]">
      <section className="relative mx-auto flex max-w-4xl flex-col items-center px-[37px] py-[91px] text-center">
        <div className="absolute -top-[33px] h-[240px] w-[517px] rounded-[47px] bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 opacity-50 blur-3xl" />
        <div className="mb-6 rounded-full border border-purple-200 bg-white px-3 py-1 text-sm text-purple-600 shadow-xl">
          <Sparkles className="mr-2 inline h-4 w-4" />
          AI-powered workflow
        </div>
        <h1 className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-6xl font-bold tracking-tight text-transparent">
          Supercharge your beautiful modern workflow
        </h1>
        <p className="mt-[27px] max-w-3xl text-lg text-muted-foreground">
          Transform how teams ship faster with a seamless platform for every workflow.
        </p>
        <div className="mt-8 flex gap-4">
          <a href="/start" className="rounded-xl bg-blue-500 px-[31px] py-[13px] text-white shadow-2xl">
            Get started
          </a>
          <a href="/demo" className="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-gray-500 shadow-lg">
            Watch demo
          </a>
        </div>
      </section>
      <section className="grid gap-6 p-8 md:grid-cols-3">
        <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
          <div className="rounded-xl border bg-white p-5 shadow-md">
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xl">
              <Zap className="size-5 text-purple-600" />
              <p className="mt-3 text-muted-foreground">Beautiful automation for modern teams.</p>
            </div>
          </div>
        </div>
        <div className="rounded-3xl border bg-card p-6 text-card-foreground shadow-sm">
          <div className="rounded-md border bg-white p-5 shadow">
            <div className="rounded-[17px] border border-zinc-200 bg-white p-4 shadow-2xl">
              <Rocket className="size-6 text-pink-500" />
              <p className="mt-3 text-muted-foreground">Seamless insights for every workflow.</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
          <p className="space-y-1.5 text-muted-foreground">Modern cards with muted copy everywhere.</p>
        </div>
      </section>
    </main>
  );
}
