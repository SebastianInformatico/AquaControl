import { divers, formatDate, getDashboardSummary, getExpirationAlerts, jobs, travels } from "@/lib/operations-data";

const navItems = ["Dashboard", "Buzos", "Faenas", "Viajes", "Configuracion"];

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700">{children}</span>;
}

export default function Home() {
  const summary = getDashboardSummary();
  const alerts = getExpirationAlerts();
  const diverNames = new Map(divers.map((diver) => [diver.id, diver.fullName]));

  return (
    <div className="min-h-screen bg-[#f4f7f8] text-[#10242d]">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-[#dce5e8] bg-white px-5 py-6 lg:block">
        <div className="mb-9 flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-lg bg-[#007d8f] text-sm font-bold text-white">AC</div>
          <div>
            <strong className="block text-base">AquaControl</strong>
            <span className="text-sm text-[#64747b]">Operacion submarina</span>
          </div>
        </div>
        <nav className="space-y-1" aria-label="Navegacion principal">
          {navItems.map((item, index) => (
            <a
              className={`block rounded-md px-3 py-2.5 text-sm font-medium ${index === 0 ? "bg-[#e6f4f6] text-[#005f6d]" : "text-[#506168] hover:bg-slate-50"}`}
              href={index === 0 ? "#" : `#${item.toLowerCase()}`}
              key={item}
            >
              {item}
            </a>
          ))}
        </nav>
      </aside>

      <main className="lg:pl-72">
        <header className="border-b border-[#dce5e8] bg-white px-5 py-5 sm:px-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#007d8f]">Gestion operativa</p>
          <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold sm:text-3xl">Control de buzos, faenas y viajes</h1>
              <p className="mt-1 text-sm text-[#64747b]">Base Next.js lista para Vercel con datos operativos iniciales.</p>
            </div>
            <a className="inline-flex h-10 items-center justify-center rounded-md bg-[#007d8f] px-4 text-sm font-semibold text-white hover:bg-[#005f6d]" href="/api/operations">
              API operaciones
            </a>
          </div>
        </header>

        <div className="space-y-6 px-5 py-6 sm:px-8">
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ["Buzos registrados", summary.totalDivers],
              ["Buzos disponibles", summary.availableDivers],
              ["Faenas activas", summary.activeJobs],
              ["Docs por vencer", summary.expiringDocuments],
            ].map(([label, value]) => (
              <article className="rounded-lg border border-[#dce5e8] bg-white p-5 shadow-sm" key={label}>
                <span className="text-sm text-[#64747b]">{label}</span>
                <strong className="mt-3 block text-3xl font-semibold">{value}</strong>
              </article>
            ))}
          </section>

          <section className="grid gap-5 xl:grid-cols-3">
            <article className="rounded-lg border border-[#dce5e8] bg-white p-5 shadow-sm">
              <h2 className="text-base font-semibold">Alertas de vencimiento</h2>
              <div className="mt-4 space-y-3">
                {alerts.map((alert) => (
                  <div className="rounded-md border border-slate-100 bg-slate-50 p-3" key={alert.id}>
                    <div className="flex items-center justify-between gap-3">
                      <strong className="text-sm">{alert.name}</strong>
                      <Badge>{alert.severity}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-[#64747b]">{alert.diverName} vence el {formatDate(alert.expiresAt)}</p>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-lg border border-[#dce5e8] bg-white p-5 shadow-sm xl:col-span-2">
              <h2 className="text-base font-semibold">Faenas proximas y activas</h2>
              <div className="mt-4 divide-y divide-slate-100">
                {jobs.map((job) => (
                  <div className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between" key={job.id}>
                    <div>
                      <strong className="text-sm">{job.farmingCenter}</strong>
                      <p className="text-sm text-[#64747b]">{job.client} - {job.location}</p>
                    </div>
                    <Badge>{job.status}</Badge>
                  </div>
                ))}
              </div>
            </article>
          </section>

          <section className="rounded-lg border border-[#dce5e8] bg-white p-5 shadow-sm" id="buzos">
            <h2 className="text-base font-semibold">Buzos</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                <thead className="border-b border-slate-200 text-xs uppercase text-[#64747b]">
                  <tr>
                    <th className="py-3 pr-4">Buzo</th>
                    <th className="py-3 pr-4">Base</th>
                    <th className="py-3 pr-4">Disponibilidad</th>
                    <th className="py-3 pr-4">Estado</th>
                    <th className="py-3 pr-4">Tarjeta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {divers.map((diver) => (
                    <tr key={diver.id}>
                      <td className="py-3 pr-4">
                        <strong className="block">{diver.fullName}</strong>
                        <span className="text-[#64747b]">{diver.rut}</span>
                      </td>
                      <td className="py-3 pr-4">{diver.baseCity}</td>
                      <td className="py-3 pr-4"><Badge>{diver.availability}</Badge></td>
                      <td className="py-3 pr-4">{diver.status}</td>
                      <td className="py-3 pr-4">{formatDate(diver.divingCardExpiresAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-lg border border-[#dce5e8] bg-white p-5 shadow-sm" id="viajes">
            <h2 className="text-base font-semibold">Viajes y pasajes</h2>
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {travels.map((travel) => (
                <article className="rounded-md border border-slate-100 bg-slate-50 p-4" key={travel.id}>
                  <div className="flex items-center justify-between gap-3">
                    <strong>{travel.origin} a {travel.destination}</strong>
                    <Badge>{travel.status}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-[#64747b]">{diverNames.get(travel.diverId)} - {formatDate(travel.departureDate)} {travel.departureTime}</p>
                </article>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
