import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    services: [
      "Ads de Performance",
      "Contenido que Convierte",
      "Automatizacion CRM"
    ]
  });
}
