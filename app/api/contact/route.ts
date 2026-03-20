import { NextResponse } from "next/server";
import { insertLead } from "../../../lib/sql";

export const runtime = "nodejs";
const BOOKING_URL = process.env.BOOKING_URL || process.env.NEXT_PUBLIC_BOOKING_URL || "https://calendly.com";

type LeadPayload = {
  name?: string;
  email: string;
  company?: string;
  goal?: string;
};

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  let body: Partial<LeadPayload> = {};
  if (isJson) {
    body = (await request.json()) as Partial<LeadPayload>;
  } else {
    const form = await request.formData();
    body = {
      name: String(form.get("name") || ""),
      email: String(form.get("email") || ""),
      company: String(form.get("company") || ""),
      goal: String(form.get("goal") || "")
    };
  }

  if (!body.email) {
    if (isJson) {
      return NextResponse.json(
        { ok: false, message: "Ingresa un correo para continuar." },
        { status: 400 }
      );
    }
    return NextResponse.redirect(new URL("/?contact_error=missing_email#contacto", request.url), 303);
  }

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email);
  if (!isValidEmail) {
    if (isJson) {
      return NextResponse.json(
        { ok: false, message: "El email no es valido." },
        { status: 400 }
      );
    }
    return NextResponse.redirect(new URL("/?contact_error=invalid_email#contacto", request.url), 303);
  }

  try {
    insertLead({
      name: String(body.name || "").trim(),
      email: String(body.email || "").trim(),
      company: String(body.company || "").trim(),
      goal: String(body.goal || "").trim()
    });
  } catch {
    if (isJson) {
      return NextResponse.json(
        { ok: false, message: "No pudimos guardar tu solicitud. Intenta de nuevo." },
        { status: 500 }
      );
    }
    return NextResponse.redirect(new URL("/?contact_error=save_failed#contacto", request.url), 303);
  }

  if (!isJson) {
    return NextResponse.redirect(BOOKING_URL, 303);
  }

  return NextResponse.json({
    ok: true,
    message: "Diagnostico solicitado. Guardamos tu correo y te contactaremos en menos de 24 horas.",
    redirectUrl: BOOKING_URL
  });
}
