"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Diver,
  Job,
  TravelTicket,
  divers as seedDivers,
  formatDate,
  jobs as seedJobs,
  travels as seedTravels,
} from "@/lib/operations-data";

type Session = {
  name: string;
  email: string;
};

type OperationsState = {
  divers: Diver[];
  jobs: Job[];
  travels: TravelTicket[];
};

const STORAGE_KEY = "aquacontrol.operations.v1";
const SESSION_KEY = "aquacontrol.session.v1";
const demoUser = { email: "admin@aquacontrol.cl", password: "AquaControl2026" };

const initialState: OperationsState = {
  divers: seedDivers,
  jobs: seedJobs,
  travels: seedTravels,
};

const emptyDiver = {
  fullName: "",
  rut: "",
  phone: "",
  email: "",
  baseCity: "",
  availability: "disponible",
  divingCardExpiresAt: "",
};

const emptyJob = {
  client: "",
  farmingCenter: "",
  location: "",
  startsAt: "",
  endsAt: "",
  status: "programada",
  notes: "",
};

const emptyTravel = {
  diverId: "",
  jobId: "",
  type: "terrestre",
  origin: "",
  destination: "",
  departureDate: "",
  departureTime: "",
  status: "pendiente",
};

function uid(prefix: string) {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "good" | "warn" | "bad" }) {
  const tones = {
    neutral: "border-slate-200 bg-slate-50 text-slate-700",
    good: "border-emerald-200 bg-emerald-50 text-emerald-700",
    warn: "border-amber-200 bg-amber-50 text-amber-700",
    bad: "border-rose-200 bg-rose-50 text-rose-700",
  };

  return <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${tones[tone]}`}>{children}</span>;
}

function statusTone(value: string): "neutral" | "good" | "warn" | "bad" {
  if (["disponible", "activa", "comprado", "activo"].includes(value)) return "good";
  if (["pendiente", "programada", "en-faena"].includes(value)) return "warn";
  if (["cancelada", "cancelado", "no-disponible", "inactivo"].includes(value)) return "bad";
  return "neutral";
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-[#30464e]">
      {label}
      {children}
    </label>
  );
}

const inputClass = "h-10 rounded-md border border-[#cfdcdf] bg-white px-3 text-sm outline-none transition focus:border-[#007d8f] focus:ring-2 focus:ring-[#007d8f]/15";
const textareaClass = "min-h-24 rounded-md border border-[#cfdcdf] bg-white px-3 py-2 text-sm outline-none transition focus:border-[#007d8f] focus:ring-2 focus:ring-[#007d8f]/15";

export function AquaControlApp() {
  const [session, setSession] = useState<Session | null>(null);
  const [state, setState] = useState<OperationsState>(initialState);
  const [activeView, setActiveView] = useState("dashboard");
  const [loginError, setLoginError] = useState("");
  const [diverForm, setDiverForm] = useState(emptyDiver);
  const [jobForm, setJobForm] = useState(emptyJob);
  const [travelForm, setTravelForm] = useState(emptyTravel);
  const [documentForm, setDocumentForm] = useState({ diverId: "", name: "", type: "certificado-medico", expiresAt: "" });

  useEffect(() => {
    const savedSession = localStorage.getItem(SESSION_KEY);
    const savedState = localStorage.getItem(STORAGE_KEY);

    if (savedSession) setSession(JSON.parse(savedSession) as Session);
    if (savedState) setState(JSON.parse(savedState) as OperationsState);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const summary = useMemo(() => {
    const expiringDocuments = state.divers.flatMap((diver) => diver.documents).filter((document) => {
      const days = (new Date(`${document.expiresAt}T00:00:00`).getTime() - Date.now()) / 86_400_000;
      return days >= 0 && days <= 45;
    }).length;

    return {
      totalDivers: state.divers.length,
      availableDivers: state.divers.filter((diver) => diver.availability === "disponible").length,
      activeJobs: state.jobs.filter((job) => job.status === "activa").length,
      pendingTravels: state.travels.filter((travel) => travel.status === "pendiente").length,
      expiringDocuments,
    };
  }, [state]);

  const alerts = useMemo(() => state.divers.flatMap((diver) =>
    diver.documents.map((document) => ({
      ...document,
      diverName: diver.fullName,
      expired: new Date(document.expiresAt).getTime() < Date.now(),
    })),
  ).sort((a, b) => a.expiresAt.localeCompare(b.expiresAt)).slice(0, 6), [state.divers]);

  const diverNames = useMemo(() => new Map(state.divers.map((diver) => [diver.id, diver.fullName])), [state.divers]);
  const jobNames = useMemo(() => new Map(state.jobs.map((job) => [job.id, job.farmingCenter])), [state.jobs]);

  function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "");

    if (email !== demoUser.email || password !== demoUser.password) {
      setLoginError("Credenciales invalidas.");
      return;
    }

    const nextSession = { name: "Administrador", email };
    localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
    setSession(nextSession);
    setLoginError("");
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
    setSession(null);
    setActiveView("dashboard");
  }

  function addDiver(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextDiver: Diver = {
      id: uid("div"),
      rut: diverForm.rut,
      fullName: diverForm.fullName,
      phone: diverForm.phone,
      email: diverForm.email,
      baseCity: diverForm.baseCity,
      status: "activo",
      availability: diverForm.availability as Diver["availability"],
      divingCardExpiresAt: diverForm.divingCardExpiresAt,
      documents: [],
    };

    setState((current) => ({ ...current, divers: [nextDiver, ...current.divers] }));
    setDiverForm(emptyDiver);
  }

  function addJob(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextJob: Job = {
      id: uid("job"),
      client: jobForm.client,
      farmingCenter: jobForm.farmingCenter,
      location: jobForm.location,
      startsAt: jobForm.startsAt,
      endsAt: jobForm.endsAt,
      status: jobForm.status as Job["status"],
      notes: jobForm.notes,
      diverIds: [],
    };

    setState((current) => ({ ...current, jobs: [nextJob, ...current.jobs] }));
    setJobForm(emptyJob);
  }

  function addTravel(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextTravel: TravelTicket = {
      id: uid("trv"),
      diverId: travelForm.diverId,
      jobId: travelForm.jobId,
      type: travelForm.type as TravelTicket["type"],
      origin: travelForm.origin,
      destination: travelForm.destination,
      departureDate: travelForm.departureDate,
      departureTime: travelForm.departureTime,
      status: travelForm.status as TravelTicket["status"],
    };

    setState((current) => ({ ...current, travels: [nextTravel, ...current.travels] }));
    setTravelForm({ ...emptyTravel, diverId: state.divers[0]?.id ?? "", jobId: state.jobs[0]?.id ?? "" });
  }

  function addDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState((current) => ({
      ...current,
      divers: current.divers.map((diver) => diver.id === documentForm.diverId ? {
        ...diver,
        documents: [
          { id: uid("doc"), name: documentForm.name, type: documentForm.type, expiresAt: documentForm.expiresAt },
          ...diver.documents,
        ],
      } : diver),
    }));
    setDocumentForm({ diverId: documentForm.diverId, name: "", type: "certificado-medico", expiresAt: "" });
  }

  function removeDiver(id: string) {
    setState((current) => ({
      divers: current.divers.filter((diver) => diver.id !== id),
      jobs: current.jobs.map((job) => ({ ...job, diverIds: job.diverIds.filter((diverId) => diverId !== id) })),
      travels: current.travels.filter((travel) => travel.diverId !== id),
    }));
  }

  function updateDiverAvailability(id: string, availability: Diver["availability"]) {
    setState((current) => ({
      ...current,
      divers: current.divers.map((diver) => diver.id === id ? { ...diver, availability } : diver),
    }));
  }

  function assignDiver(jobId: string, diverId: string) {
    if (!diverId) return;
    setState((current) => ({
      ...current,
      jobs: current.jobs.map((job) => job.id === jobId && !job.diverIds.includes(diverId)
        ? { ...job, diverIds: [...job.diverIds, diverId] }
        : job),
    }));
  }

  function removeJob(id: string) {
    setState((current) => ({
      ...current,
      jobs: current.jobs.filter((job) => job.id !== id),
      travels: current.travels.filter((travel) => travel.jobId !== id),
    }));
  }

  function updateJobStatus(id: string, status: Job["status"]) {
    setState((current) => ({
      ...current,
      jobs: current.jobs.map((job) => job.id === id ? { ...job, status } : job),
    }));
  }

  function updateTravelStatus(id: string, status: TravelTicket["status"]) {
    setState((current) => ({
      ...current,
      travels: current.travels.map((travel) => travel.id === id ? { ...travel, status } : travel),
    }));
  }

  function resetDemoData() {
    setState(initialState);
  }

  if (!session) {
    return (
      <main className="grid min-h-screen bg-[#eef5f6] px-5 py-8 text-[#10242d] lg:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden content-center rounded-2xl bg-[#005f6d] p-10 text-white lg:grid">
          <div className="max-w-xl">
            <div className="mb-8 grid size-14 place-items-center rounded-xl bg-white/12 text-lg font-bold">AC</div>
            <p className="text-sm font-semibold uppercase tracking-widest text-cyan-100">AquaControl</p>
            <h1 className="mt-3 text-4xl font-semibold leading-tight">Gestion profesional para operaciones submarinas.</h1>
            <p className="mt-4 text-base leading-7 text-cyan-50/85">Administra buzos, documentos, faenas, asignaciones y pasajes desde una PWA preparada para Vercel.</p>
            <div className="mt-10 grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-white/15 bg-white/10 p-4"><strong className="block text-2xl">{state.divers.length}</strong><span className="text-sm text-cyan-50/80">Buzos</span></div>
              <div className="rounded-lg border border-white/15 bg-white/10 p-4"><strong className="block text-2xl">{state.jobs.length}</strong><span className="text-sm text-cyan-50/80">Faenas</span></div>
              <div className="rounded-lg border border-white/15 bg-white/10 p-4"><strong className="block text-2xl">{state.travels.length}</strong><span className="text-sm text-cyan-50/80">Viajes</span></div>
            </div>
          </div>
        </section>

        <section className="grid content-center">
          <form className="mx-auto w-full max-w-md rounded-xl border border-[#dce5e8] bg-white p-6 shadow-sm" onSubmit={login}>
            <div className="mb-6">
              <div className="mb-4 grid size-12 place-items-center rounded-lg bg-[#007d8f] text-sm font-bold text-white lg:hidden">AC</div>
              <p className="text-sm font-semibold uppercase tracking-widest text-[#007d8f]">Acceso privado</p>
              <h2 className="mt-2 text-2xl font-semibold">Iniciar sesion</h2>
              <p className="mt-1 text-sm text-[#64747b]">Ingresa con tu cuenta administrativa.</p>
            </div>
            <div className="grid gap-4">
              <Field label="Email">
                <input className={inputClass} name="email" type="email" defaultValue={demoUser.email} required />
              </Field>
              <Field label="Clave">
                <input className={inputClass} name="password" type="password" defaultValue={demoUser.password} required />
              </Field>
              {loginError ? <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{loginError}</p> : null}
              <button className="h-11 rounded-md bg-[#007d8f] px-4 text-sm font-semibold text-white hover:bg-[#005f6d]" type="submit">Entrar</button>
              <p className="text-xs text-[#64747b]">Demo: {demoUser.email} / {demoUser.password}</p>
            </div>
          </form>
        </section>
      </main>
    );
  }

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
          {[
            ["dashboard", "Dashboard"],
            ["buzos", "Buzos"],
            ["faenas", "Faenas"],
            ["viajes", "Viajes"],
            ["configuracion", "Configuracion"],
          ].map(([view, label]) => (
            <button className={`block w-full rounded-md px-3 py-2.5 text-left text-sm font-medium ${activeView === view ? "bg-[#e6f4f6] text-[#005f6d]" : "text-[#506168] hover:bg-slate-50"}`} key={view} onClick={() => setActiveView(view)}>
              {label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="lg:pl-72">
        <header className="border-b border-[#dce5e8] bg-white px-5 py-5 sm:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#007d8f]">Gestion operativa</p>
              <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">Control de buzos, faenas y viajes</h1>
              <p className="mt-1 text-sm text-[#64747b]">Sesion activa: {session.name}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="h-10 rounded-md border border-[#cfdcdf] bg-white px-4 text-sm font-semibold text-[#30464e]" onClick={resetDemoData}>Restaurar demo</button>
              <button className="h-10 rounded-md bg-[#10242d] px-4 text-sm font-semibold text-white" onClick={logout}>Salir</button>
            </div>
          </div>
          <div className="mt-4 flex gap-2 overflow-x-auto lg:hidden">
            {["dashboard", "buzos", "faenas", "viajes", "configuracion"].map((view) => (
              <button className={`rounded-md px-3 py-2 text-sm font-medium ${activeView === view ? "bg-[#007d8f] text-white" : "bg-slate-100 text-[#506168]"}`} key={view} onClick={() => setActiveView(view)}>
                {view}
              </button>
            ))}
          </div>
        </header>

        <div className="space-y-6 px-5 py-6 sm:px-8">
          {activeView === "dashboard" ? (
            <>
              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                {[
                  ["Buzos registrados", summary.totalDivers],
                  ["Buzos disponibles", summary.availableDivers],
                  ["Faenas activas", summary.activeJobs],
                  ["Viajes pendientes", summary.pendingTravels],
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
                  <h2 className="text-base font-semibold">Alertas documentales</h2>
                  <div className="mt-4 space-y-3">
                    {alerts.map((alert) => (
                      <div className="rounded-md border border-slate-100 bg-slate-50 p-3" key={alert.id}>
                        <div className="flex items-center justify-between gap-3">
                          <strong className="text-sm">{alert.name}</strong>
                          <Badge tone={alert.expired ? "bad" : "warn"}>{alert.expired ? "vencido" : "por vencer"}</Badge>
                        </div>
                        <p className="mt-1 text-sm text-[#64747b]">{alert.diverName} vence el {formatDate(alert.expiresAt)}</p>
                      </div>
                    ))}
                  </div>
                </article>
                <article className="rounded-lg border border-[#dce5e8] bg-white p-5 shadow-sm xl:col-span-2">
                  <h2 className="text-base font-semibold">Faenas activas y programadas</h2>
                  <div className="mt-4 divide-y divide-slate-100">
                    {state.jobs.map((job) => (
                      <div className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between" key={job.id}>
                        <div>
                          <strong className="text-sm">{job.farmingCenter}</strong>
                          <p className="text-sm text-[#64747b]">{job.client} - {job.location}</p>
                        </div>
                        <Badge tone={statusTone(job.status)}>{job.status}</Badge>
                      </div>
                    ))}
                  </div>
                </article>
              </section>
            </>
          ) : null}

          {activeView === "buzos" ? (
            <section className="grid gap-5 xl:grid-cols-[1fr_380px]">
              <article className="rounded-lg border border-[#dce5e8] bg-white p-5 shadow-sm">
                <h2 className="text-base font-semibold">Buzos</h2>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[860px] border-collapse text-left text-sm">
                    <thead className="border-b border-slate-200 text-xs uppercase text-[#64747b]">
                      <tr><th className="py-3 pr-4">Buzo</th><th className="py-3 pr-4">Base</th><th className="py-3 pr-4">Disponibilidad</th><th className="py-3 pr-4">Tarjeta</th><th className="py-3 pr-4">Acciones</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {state.divers.map((diver) => (
                        <tr key={diver.id}>
                          <td className="py-3 pr-4"><strong className="block">{diver.fullName}</strong><span className="text-[#64747b]">{diver.rut} - {diver.phone}</span></td>
                          <td className="py-3 pr-4">{diver.baseCity}</td>
                          <td className="py-3 pr-4">
                            <select className={inputClass} value={diver.availability} onChange={(event) => updateDiverAvailability(diver.id, event.target.value as Diver["availability"])}>
                              <option value="disponible">disponible</option><option value="en-faena">en-faena</option><option value="no-disponible">no-disponible</option>
                            </select>
                          </td>
                          <td className="py-3 pr-4">{diver.divingCardExpiresAt ? formatDate(diver.divingCardExpiresAt) : "Sin fecha"}</td>
                          <td className="py-3 pr-4"><button className="rounded-md border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700" onClick={() => removeDiver(diver.id)}>Eliminar</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>
              <div className="space-y-5">
                <form className="rounded-lg border border-[#dce5e8] bg-white p-5 shadow-sm" onSubmit={addDiver}>
                  <h2 className="text-base font-semibold">Nuevo buzo</h2>
                  <div className="mt-4 grid gap-3">
                    <Field label="Nombre completo"><input className={inputClass} required value={diverForm.fullName} onChange={(e) => setDiverForm({ ...diverForm, fullName: e.target.value })} /></Field>
                    <Field label="RUT"><input className={inputClass} required value={diverForm.rut} onChange={(e) => setDiverForm({ ...diverForm, rut: e.target.value })} /></Field>
                    <Field label="Telefono"><input className={inputClass} value={diverForm.phone} onChange={(e) => setDiverForm({ ...diverForm, phone: e.target.value })} /></Field>
                    <Field label="Email"><input className={inputClass} type="email" value={diverForm.email} onChange={(e) => setDiverForm({ ...diverForm, email: e.target.value })} /></Field>
                    <Field label="Ciudad base"><input className={inputClass} required value={diverForm.baseCity} onChange={(e) => setDiverForm({ ...diverForm, baseCity: e.target.value })} /></Field>
                    <Field label="Disponibilidad"><select className={inputClass} value={diverForm.availability} onChange={(e) => setDiverForm({ ...diverForm, availability: e.target.value })}><option value="disponible">Disponible</option><option value="en-faena">En faena</option><option value="no-disponible">No disponible</option></select></Field>
                    <Field label="Vence tarjeta"><input className={inputClass} type="date" required value={diverForm.divingCardExpiresAt} onChange={(e) => setDiverForm({ ...diverForm, divingCardExpiresAt: e.target.value })} /></Field>
                    <button className="h-10 rounded-md bg-[#007d8f] text-sm font-semibold text-white">Guardar buzo</button>
                  </div>
                </form>

                <form className="rounded-lg border border-[#dce5e8] bg-white p-5 shadow-sm" onSubmit={addDocument}>
                  <h2 className="text-base font-semibold">Agregar documento</h2>
                  <div className="mt-4 grid gap-3">
                    <Field label="Buzo"><select className={inputClass} required value={documentForm.diverId} onChange={(e) => setDocumentForm({ ...documentForm, diverId: e.target.value })}><option value="">Seleccionar</option>{state.divers.map((diver) => <option key={diver.id} value={diver.id}>{diver.fullName}</option>)}</select></Field>
                    <Field label="Documento"><input className={inputClass} required value={documentForm.name} onChange={(e) => setDocumentForm({ ...documentForm, name: e.target.value })} /></Field>
                    <Field label="Tipo"><input className={inputClass} value={documentForm.type} onChange={(e) => setDocumentForm({ ...documentForm, type: e.target.value })} /></Field>
                    <Field label="Vencimiento"><input className={inputClass} type="date" required value={documentForm.expiresAt} onChange={(e) => setDocumentForm({ ...documentForm, expiresAt: e.target.value })} /></Field>
                    <button className="h-10 rounded-md bg-[#10242d] text-sm font-semibold text-white">Guardar documento</button>
                  </div>
                </form>
              </div>
            </section>
          ) : null}

          {activeView === "faenas" ? (
            <section className="grid gap-5 xl:grid-cols-[1fr_380px]">
              <article className="rounded-lg border border-[#dce5e8] bg-white p-5 shadow-sm">
                <h2 className="text-base font-semibold">Faenas</h2>
                <div className="mt-4 grid gap-3">
                  {state.jobs.map((job) => (
                    <div className="rounded-lg border border-slate-100 bg-slate-50 p-4" key={job.id}>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div><strong>{job.farmingCenter}</strong><p className="text-sm text-[#64747b]">{job.client} - {job.location}</p><p className="mt-1 text-sm text-[#64747b]">{formatDate(job.startsAt)} al {formatDate(job.endsAt)}</p></div>
                        <select className={inputClass} value={job.status} onChange={(event) => updateJobStatus(job.id, event.target.value as Job["status"])}><option value="programada">programada</option><option value="activa">activa</option><option value="finalizada">finalizada</option><option value="cancelada">cancelada</option></select>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">{job.diverIds.map((id) => <Badge key={id}>{diverNames.get(id)}</Badge>)}</div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <select className={inputClass} onChange={(event) => assignDiver(job.id, event.target.value)} defaultValue=""><option value="">Asignar buzo</option>{state.divers.map((diver) => <option key={diver.id} value={diver.id}>{diver.fullName}</option>)}</select>
                        <button className="rounded-md border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700" onClick={() => removeJob(job.id)}>Eliminar</button>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
              <form className="rounded-lg border border-[#dce5e8] bg-white p-5 shadow-sm" onSubmit={addJob}>
                <h2 className="text-base font-semibold">Nueva faena</h2>
                <div className="mt-4 grid gap-3">
                  <Field label="Cliente"><input className={inputClass} required value={jobForm.client} onChange={(e) => setJobForm({ ...jobForm, client: e.target.value })} /></Field>
                  <Field label="Centro"><input className={inputClass} required value={jobForm.farmingCenter} onChange={(e) => setJobForm({ ...jobForm, farmingCenter: e.target.value })} /></Field>
                  <Field label="Ubicacion"><input className={inputClass} required value={jobForm.location} onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })} /></Field>
                  <div className="grid grid-cols-2 gap-3"><Field label="Inicio"><input className={inputClass} type="date" required value={jobForm.startsAt} onChange={(e) => setJobForm({ ...jobForm, startsAt: e.target.value })} /></Field><Field label="Termino"><input className={inputClass} type="date" required value={jobForm.endsAt} onChange={(e) => setJobForm({ ...jobForm, endsAt: e.target.value })} /></Field></div>
                  <Field label="Estado"><select className={inputClass} value={jobForm.status} onChange={(e) => setJobForm({ ...jobForm, status: e.target.value })}><option value="programada">Programada</option><option value="activa">Activa</option><option value="finalizada">Finalizada</option><option value="cancelada">Cancelada</option></select></Field>
                  <Field label="Observaciones"><textarea className={textareaClass} value={jobForm.notes} onChange={(e) => setJobForm({ ...jobForm, notes: e.target.value })} /></Field>
                  <button className="h-10 rounded-md bg-[#007d8f] text-sm font-semibold text-white">Guardar faena</button>
                </div>
              </form>
            </section>
          ) : null}

          {activeView === "viajes" ? (
            <section className="grid gap-5 xl:grid-cols-[1fr_380px]">
              <article className="rounded-lg border border-[#dce5e8] bg-white p-5 shadow-sm">
                <h2 className="text-base font-semibold">Viajes y pasajes</h2>
                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                  {state.travels.map((travel) => (
                    <article className="rounded-md border border-slate-100 bg-slate-50 p-4" key={travel.id}>
                      <div className="flex items-center justify-between gap-3"><strong>{travel.origin} a {travel.destination}</strong><Badge tone={statusTone(travel.status)}>{travel.status}</Badge></div>
                      <p className="mt-1 text-sm text-[#64747b]">{diverNames.get(travel.diverId)} - {jobNames.get(travel.jobId)}</p>
                      <p className="text-sm text-[#64747b]">{formatDate(travel.departureDate)} {travel.departureTime} - {travel.type}</p>
                      <select className={`${inputClass} mt-3`} value={travel.status} onChange={(event) => updateTravelStatus(travel.id, event.target.value as TravelTicket["status"])}><option value="pendiente">pendiente</option><option value="comprado">comprado</option><option value="usado">usado</option><option value="cancelado">cancelado</option></select>
                    </article>
                  ))}
                </div>
              </article>
              <form className="rounded-lg border border-[#dce5e8] bg-white p-5 shadow-sm" onSubmit={addTravel}>
                <h2 className="text-base font-semibold">Nuevo viaje</h2>
                <div className="mt-4 grid gap-3">
                  <Field label="Buzo"><select className={inputClass} required value={travelForm.diverId} onChange={(e) => setTravelForm({ ...travelForm, diverId: e.target.value })}><option value="">Seleccionar</option>{state.divers.map((diver) => <option key={diver.id} value={diver.id}>{diver.fullName}</option>)}</select></Field>
                  <Field label="Faena"><select className={inputClass} required value={travelForm.jobId} onChange={(e) => setTravelForm({ ...travelForm, jobId: e.target.value })}><option value="">Seleccionar</option>{state.jobs.map((job) => <option key={job.id} value={job.id}>{job.farmingCenter}</option>)}</select></Field>
                  <div className="grid grid-cols-2 gap-3"><Field label="Origen"><input className={inputClass} required value={travelForm.origin} onChange={(e) => setTravelForm({ ...travelForm, origin: e.target.value })} /></Field><Field label="Destino"><input className={inputClass} required value={travelForm.destination} onChange={(e) => setTravelForm({ ...travelForm, destination: e.target.value })} /></Field></div>
                  <div className="grid grid-cols-2 gap-3"><Field label="Fecha"><input className={inputClass} type="date" required value={travelForm.departureDate} onChange={(e) => setTravelForm({ ...travelForm, departureDate: e.target.value })} /></Field><Field label="Hora"><input className={inputClass} type="time" required value={travelForm.departureTime} onChange={(e) => setTravelForm({ ...travelForm, departureTime: e.target.value })} /></Field></div>
                  <Field label="Tipo"><select className={inputClass} value={travelForm.type} onChange={(e) => setTravelForm({ ...travelForm, type: e.target.value })}><option value="terrestre">Terrestre</option><option value="aereo">Aereo</option><option value="maritimo">Maritimo</option></select></Field>
                  <button className="h-10 rounded-md bg-[#007d8f] text-sm font-semibold text-white">Guardar viaje</button>
                </div>
              </form>
            </section>
          ) : null}

          {activeView === "configuracion" ? (
            <section className="rounded-lg border border-[#dce5e8] bg-white p-5 shadow-sm">
              <h2 className="text-base font-semibold">Configuracion</h2>
              <div className="mt-4 grid gap-4 lg:grid-cols-3">
                <div className="rounded-md border border-slate-100 bg-slate-50 p-4"><strong>Modo PWA</strong><p className="mt-1 text-sm text-[#64747b]">Instalable desde navegador y con cache basico offline.</p></div>
                <div className="rounded-md border border-slate-100 bg-slate-50 p-4"><strong>Persistencia actual</strong><p className="mt-1 text-sm text-[#64747b]">Datos guardados en este dispositivo con localStorage.</p></div>
                <div className="rounded-md border border-slate-100 bg-slate-50 p-4"><strong>Siguiente etapa</strong><p className="mt-1 text-sm text-[#64747b]">Conectar Vercel Postgres y Blob para multiusuario real.</p></div>
              </div>
            </section>
          ) : null}
        </div>
      </main>
    </div>
  );
}
