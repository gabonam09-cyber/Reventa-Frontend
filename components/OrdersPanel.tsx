"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type OrderValue = {
  customer: string;
  product: string;
  price: number;
  status: "delivered" | "shipped" | "processing";
  delivery_date?: string;
  estimated_delivery?: string;
};

type OrdersDb = Record<string, OrderValue>;

type OrdersResponse = {
  orders_db: OrdersDb;
  return_policy: {
    standard_return_window: string;
    refund_processing_time: string;
    conditions: string[];
    non_returnable: string[];
  };
  total_orders: number;
};

export function OrdersPanel() {
  const [ordersDb, setOrdersDb] = useState<OrdersDb>({});
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [policy, setPolicy] = useState<OrdersResponse["return_policy"] | null>(null);

  const orderEntries = useMemo(() => Object.entries(ordersDb), [ordersDb]);

  const loadOrders = async () => {
    const response = await fetch("/api/orders", { cache: "no-store" });
    if (!response.ok) {
      throw new Error("No se pudieron cargar pedidos.");
    }

    const data = (await response.json()) as OrdersResponse;
    setOrdersDb(data.orders_db);
    setPolicy(data.return_policy);
  };

  useEffect(() => {
    loadOrders().catch(() => {
      setStatus("No se pudo cargar la base de pedidos.");
    });
  }, []);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setStatus("");

    const formData = new FormData(event.currentTarget);
    const payload = {
      customer: String(formData.get("customer") || ""),
      product: String(formData.get("product") || ""),
      price: Number(formData.get("price") || 0),
      status: String(formData.get("status") || "processing")
    };

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = (await response.json()) as {
        ok?: boolean;
        message?: string;
        orders_db?: OrdersDb;
      };

      if (!response.ok || !data.ok || !data.orders_db) {
        setStatus(data.message || "No se pudo guardar el pedido.");
        return;
      }

      setOrdersDb(data.orders_db);
      setStatus(data.message || "Pedido agregado.");
      event.currentTarget.reset();
    } catch {
      setStatus("Error de red al guardar el pedido.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="section orders-panel reveal delay-1" id="orders-db">
      <div className="section-header">
        <p className="eyebrow">Base de datos de pedidos</p>
        <h2>Registros existentes + nuevos pedidos desde frontend</h2>
      </div>

      <form className="orders-form" onSubmit={onSubmit}>
        <label>
          Cliente
          <input name="customer" required placeholder="Nombre del cliente" />
        </label>
        <label>
          Producto
          <input name="product" required placeholder="Producto" />
        </label>
        <label>
          Precio
          <input name="price" type="number" step="0.01" min="0.01" required placeholder="199.99" />
        </label>
        <label>
          Estado
          <select name="status" defaultValue="processing">
            <option value="processing">processing</option>
            <option value="shipped">shipped</option>
            <option value="delivered">delivered</option>
          </select>
        </label>
        <button type="submit" disabled={loading}>
          {loading ? "Guardando..." : "Agregar pedido"}
        </button>
      </form>

      {status ? <p className="form-status">{status}</p> : null}

      <div className="orders-grid">
        {orderEntries.map(([orderId, order]) => (
          <article key={orderId} className="order-card">
            <p className="brand">{orderId}</p>
            <h3>{order.product}</h3>
            <p>
              <strong>Cliente:</strong> {order.customer}
            </p>
            <p>
              <strong>Precio:</strong> ${order.price.toFixed(2)}
            </p>
            <p>
              <strong>Status:</strong> {order.status}
            </p>
            {order.delivery_date ? <p><strong>Entrega:</strong> {order.delivery_date}</p> : null}
            {order.estimated_delivery ? <p><strong>Entrega estimada:</strong> {order.estimated_delivery}</p> : null}
          </article>
        ))}
      </div>

      {policy ? (
        <div className="policy-box">
          <h3>Politica de devoluciones</h3>
          <p>
            Ventana: {policy.standard_return_window} | Reembolso: {policy.refund_processing_time}
          </p>
        </div>
      ) : null}
    </section>
  );
}
