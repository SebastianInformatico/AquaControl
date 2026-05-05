import { NextResponse } from "next/server";
import { divers, getDashboardSummary, getExpirationAlerts, jobs, travels } from "@/lib/operations-data";

export async function GET() {
  return NextResponse.json({
    summary: getDashboardSummary(),
    alerts: getExpirationAlerts(),
    divers,
    jobs,
    travels,
  });
}
