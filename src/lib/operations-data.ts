export type Diver = {
  id: string;
  rut: string;
  fullName: string;
  phone: string;
  email: string;
  baseCity: string;
  status: "activo" | "inactivo";
  availability: "disponible" | "en-faena" | "no-disponible";
  divingCardExpiresAt: string;
  lastJob?: string;
  documents: {
    id: string;
    name: string;
    type: string;
    expiresAt: string;
  }[];
};

export type Job = {
  id: string;
  client: string;
  farmingCenter: string;
  location: string;
  startsAt: string;
  endsAt: string;
  diverIds: string[];
  status: "programada" | "activa" | "finalizada" | "cancelada";
  notes: string;
};

export type TravelTicket = {
  id: string;
  diverId: string;
  jobId: string;
  type: "terrestre" | "aereo" | "maritimo";
  origin: string;
  destination: string;
  departureDate: string;
  departureTime: string;
  status: "pendiente" | "comprado" | "usado" | "cancelado";
  attachmentUrl?: string;
};

export const divers: Diver[] = [
  {
    id: "div-001",
    rut: "16.842.915-4",
    fullName: "Mauricio Lagos Paredes",
    phone: "+56 9 6123 7788",
    email: "mauricio.lagos@aquacontrol.cl",
    baseCity: "Puerto Montt",
    status: "activo",
    availability: "disponible",
    divingCardExpiresAt: "2026-05-28",
    lastJob: "Centro Huenquillahue",
    documents: [
      { id: "doc-001", name: "Certificado medico", type: "certificado-medico", expiresAt: "2026-05-16" },
      { id: "doc-002", name: "Tarjeta de buceo", type: "tarjeta-buceo", expiresAt: "2026-05-28" },
    ],
  },
  {
    id: "div-002",
    rut: "18.234.110-1",
    fullName: "Felipe Andrade Rojas",
    phone: "+56 9 8345 1200",
    email: "felipe.andrade@aquacontrol.cl",
    baseCity: "Calbuco",
    status: "activo",
    availability: "en-faena",
    divingCardExpiresAt: "2026-08-12",
    lastJob: "Centro Chidhuapi",
    documents: [
      { id: "doc-003", name: "Contrato vigente", type: "contrato", expiresAt: "2026-12-31" },
      { id: "doc-004", name: "Curso buceo seguro", type: "capacitacion", expiresAt: "2026-06-02" },
    ],
  },
  {
    id: "div-003",
    rut: "15.903.771-K",
    fullName: "Cristian Munoz Salazar",
    phone: "+56 9 9876 3421",
    email: "cristian.munoz@aquacontrol.cl",
    baseCity: "Quellon",
    status: "activo",
    availability: "no-disponible",
    divingCardExpiresAt: "2026-05-09",
    documents: [
      { id: "doc-005", name: "Certificado medico", type: "certificado-medico", expiresAt: "2026-05-09" },
      { id: "doc-006", name: "Tarjeta de buceo", type: "tarjeta-buceo", expiresAt: "2026-05-09" },
    ],
  },
];

export const jobs: Job[] = [
  {
    id: "job-001",
    client: "Salmones Austral",
    farmingCenter: "Centro Chidhuapi",
    location: "Calbuco, Region de Los Lagos",
    startsAt: "2026-05-06",
    endsAt: "2026-05-18",
    diverIds: ["div-002"],
    status: "activa",
    notes: "Inspeccion de redes, fondeos y revision post temporal.",
  },
  {
    id: "job-002",
    client: "Australis Seafoods",
    farmingCenter: "Centro Huenquillahue",
    location: "Chiloe, Region de Los Lagos",
    startsAt: "2026-05-20",
    endsAt: "2026-05-27",
    diverIds: ["div-001", "div-003"],
    status: "programada",
    notes: "Requiere coordinacion de pasajes y documentacion al dia.",
  },
];

export const travels: TravelTicket[] = [
  {
    id: "trv-001",
    diverId: "div-001",
    jobId: "job-002",
    type: "terrestre",
    origin: "Puerto Montt",
    destination: "Quellon",
    departureDate: "2026-05-19",
    departureTime: "08:30",
    status: "pendiente",
  },
  {
    id: "trv-002",
    diverId: "div-003",
    jobId: "job-002",
    type: "aereo",
    origin: "Santiago",
    destination: "Puerto Montt",
    departureDate: "2026-05-18",
    departureTime: "17:10",
    status: "comprado",
    attachmentUrl: "/tickets/trv-002.pdf",
  },
];

export function getDashboardSummary() {
  const activeJobs = jobs.filter((job) => job.status === "activa").length;
  const availableDivers = divers.filter((diver) => diver.availability === "disponible").length;
  const expiringDocuments = divers.flatMap((diver) => diver.documents).filter((document) => {
    const expiry = new Date(`${document.expiresAt}T00:00:00`);
    const now = new Date();
    const days = (expiry.getTime() - now.getTime()) / 86_400_000;
    return days >= 0 && days <= 45;
  }).length;

  return {
    totalDivers: divers.length,
    availableDivers,
    activeJobs,
    expiringDocuments,
  };
}

export function getExpirationAlerts() {
  return divers.flatMap((diver) =>
    diver.documents.map((document) => ({
      ...document,
      diverName: diver.fullName,
      severity: new Date(document.expiresAt).getTime() < Date.now() ? "critica" : "media",
    })),
  ).sort((a, b) => a.expiresAt.localeCompare(b.expiresAt)).slice(0, 5);
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" }).format(
    new Date(`${value}T00:00:00`),
  );
}
