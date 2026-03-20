"use client";

import { FormEvent, useState } from "react";

const FALLBACK_BOOKING_URL = process.env.NEXT_PUBLIC_BOOKING_URL || "https://calendly.com";

type ContactResponse = {
  ok?: boolean;
  message?: string;
  redirectUrl?: string;
};

export function LeadForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setStatus("");

    const form = event.currentTarget;
    const formData = new FormData(form);

    const payload = {
      name: String(formData.get("name") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      company: String(formData.get("company") || "").trim(),
      goal: String(formData.get("goal") || "").trim()
    };

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = (await response.json().catch(() => null)) as ContactResponse | null;
      if (!response.ok || !data?.ok) {
        throw new Error(data?.message || "No pudimos enviar tu solicitud. Intenta de nuevo.");
      }

      form.reset();
      window.location.assign(data.redirectUrl || FALLBACK_BOOKING_URL);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No pudimos enviar tu solicitud. Intenta de nuevo.";
      setStatus(message);
      setIsSubmitting(false);
    }
  };

  return (
    <form className="lead-form" onSubmit={handleSubmit}>
      <label>
        Nombre
        <input name="name" placeholder="Tu nombre (opcional)" />
      </label>
      <label>
        Email
        <input id="lead-email" name="email" type="email" required placeholder="tu@email.com" />
      </label>
      <label>
        Empresa
        <input name="company" placeholder="Nombre de tu empresa (opcional)" />
      </label>
      <label>
        Objetivo
        <textarea name="goal" rows={4} placeholder="Aumentar leads, ventas o awareness (opcional)" />
      </label>
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Enviando..." : "Solicitar Diagnostico"}
      </button>
      {status ? <p className="form-status">{status}</p> : null}
    </form>
  );
}
