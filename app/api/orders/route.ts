import { NextResponse } from "next/server";
import { createOrder } from "../../../lib/sql";

export const runtime = "nodejs";

type OrderPayload = {
  customer?: string;
  product?: string;
  price?: number;
  status?: "delivered" | "shipped" | "processing";
};

export async function GET() {
  return NextResponse.json(
    { ok: false, message: "Listado de pedidos deshabilitado para vista publica." },
    { status: 403 }
  );
}

export async function POST(request: Request) {
  const body = (await request.json()) as OrderPayload;

  if (!body.customer || !body.product || body.price === undefined || !body.status) {
    return NextResponse.json(
      { ok: false, message: "Faltan campos: customer, product, price, status." },
      { status: 400 }
    );
  }

  const validStatus = ["delivered", "shipped", "processing"].includes(body.status);
  if (!validStatus) {
    return NextResponse.json({ ok: false, message: "Status invalido." }, { status: 400 });
  }

  const numericPrice = Number(body.price);
  if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
    return NextResponse.json({ ok: false, message: "Price invalido." }, { status: 400 });
  }

  try {
    const created = createOrder({
      customer: String(body.customer).trim(),
      product: String(body.product).trim(),
      price: numericPrice,
      status: body.status
    });

    return NextResponse.json({
      ok: true,
      message: `Pedido ${created.orderId} agregado correctamente.`,
      order: created
    });
  } catch {
    return NextResponse.json({ ok: false, message: "No se pudo guardar el pedido." }, { status: 500 });
  }
}
