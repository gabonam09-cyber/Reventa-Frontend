import fs from "node:fs";
import path from "node:path";

import Database from "better-sqlite3";

export type LeadInput = {
  name: string;
  email: string;
  company: string;
  goal: string;
};

export type OrderStatus = "delivered" | "shipped" | "processing";

export type OrderInput = {
  customer: string;
  product: string;
  price: number;
  status: OrderStatus;
  deliveryDate?: string;
  estimatedDelivery?: string;
};

type OrderRow = {
  order_id: string;
  customer: string;
  product: string;
  price: number;
  status: OrderStatus;
  delivery_date: string | null;
  estimated_delivery: string | null;
};

type GlobalWithDb = typeof globalThis & {
  __growthLeadsDb?: Database.Database;
};

export const RETURN_POLICY = {
  standard_return_window: "30 dias desde la entrega",
  refund_processing_time: "5-7 dias laborables",
  conditions: [
    "El articulo debe estar en su embalaje original",
    "El articulo no debe mostrar signos de dano causado por el cliente",
    "Se requiere comprobante de compra (ID de pedido)"
  ],
  non_returnable: ["Auriculares intrauditivos (motivos de higiene)", "Licencias de software"]
};

const INITIAL_ORDERS = [
  {
    orderId: "ORD-1001",
    customer: "Alice Johnson",
    product: "Laptop Pro 15",
    price: 1299.99,
    status: "delivered" as const,
    deliveryDate: "2026-02-05",
    estimatedDelivery: null
  },
  {
    orderId: "ORD-1002",
    customer: "Bob Smith",
    product: "Wireless Headphones X3",
    price: 199.99,
    status: "shipped" as const,
    deliveryDate: null,
    estimatedDelivery: "2026-02-14"
  },
  {
    orderId: "ORD-1003",
    customer: "Carol Davis",
    product: "Smartphone Ultra 12",
    price: 899.99,
    status: "processing" as const,
    deliveryDate: null,
    estimatedDelivery: "2026-02-18"
  }
];

const globalWithDb = globalThis as GlobalWithDb;
const dataDir = path.join(process.cwd(), "data");
const dbPath = path.join(dataDir, "leads.sqlite");

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db =
  globalWithDb.__growthLeadsDb ??
  new Database(dbPath, {
    fileMustExist: false
  });

if (process.env.NODE_ENV !== "production") {
  globalWithDb.__growthLeadsDb = db;
}

db.exec(`
  CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT NOT NULL,
    company TEXT,
    goal TEXT,
    created_at TEXT NOT NULL
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id TEXT UNIQUE NOT NULL,
    customer TEXT NOT NULL,
    product TEXT NOT NULL,
    price REAL NOT NULL,
    status TEXT NOT NULL,
    delivery_date TEXT,
    estimated_delivery TEXT,
    created_at TEXT NOT NULL
  )
`);

const countOrdersRow = db.prepare("SELECT COUNT(*) as total FROM orders").get() as { total: number };
if (countOrdersRow.total === 0) {
  const seedStatement = db.prepare(`
    INSERT INTO orders (order_id, customer, product, price, status, delivery_date, estimated_delivery, created_at)
    VALUES (@orderId, @customer, @product, @price, @status, @deliveryDate, @estimatedDelivery, @createdAt)
  `);

  const seedTransaction = db.transaction(() => {
    for (const order of INITIAL_ORDERS) {
      seedStatement.run({
        orderId: order.orderId,
        customer: order.customer,
        product: order.product,
        price: order.price,
        status: order.status,
        deliveryDate: order.deliveryDate,
        estimatedDelivery: order.estimatedDelivery,
        createdAt: new Date().toISOString()
      });
    }
  });

  seedTransaction();
}

const insertLeadStatement = db.prepare(`
  INSERT INTO leads (name, email, company, goal, created_at)
  VALUES (@name, @email, @company, @goal, @createdAt)
`);

const getOrdersStatement = db.prepare(`
  SELECT order_id, customer, product, price, status, delivery_date, estimated_delivery
  FROM orders
  ORDER BY id ASC
`);

const getMaxOrderIdStatement = db.prepare(`
  SELECT MAX(CAST(SUBSTR(order_id, 5) AS INTEGER)) as maxId
  FROM orders
`);

const insertOrderStatement = db.prepare(`
  INSERT INTO orders (order_id, customer, product, price, status, delivery_date, estimated_delivery, created_at)
  VALUES (@orderId, @customer, @product, @price, @status, @deliveryDate, @estimatedDelivery, @createdAt)
`);

export function insertLead(input: LeadInput) {
  insertLeadStatement.run({
    name: input.name,
    email: input.email,
    company: input.company,
    goal: input.goal,
    createdAt: new Date().toISOString()
  });
}

function nextOrderId() {
  const row = getMaxOrderIdStatement.get() as { maxId: number | null };
  const next = (row.maxId ?? 1000) + 1;
  return `ORD-${next}`;
}

function mapRowToOrderValue(row: OrderRow) {
  return {
    customer: row.customer,
    product: row.product,
    price: row.price,
    status: row.status,
    ...(row.delivery_date ? { delivery_date: row.delivery_date } : {}),
    ...(row.estimated_delivery ? { estimated_delivery: row.estimated_delivery } : {})
  };
}

export function getOrdersDbObject() {
  const rows = getOrdersStatement.all() as OrderRow[];
  return rows.reduce<Record<string, ReturnType<typeof mapRowToOrderValue>>>((acc, row) => {
    acc[row.order_id] = mapRowToOrderValue(row);
    return acc;
  }, {});
}

export function createOrder(input: OrderInput) {
  const now = new Date();
  const orderId = nextOrderId();
  const today = now.toISOString().slice(0, 10);

  const deliveryDate = input.status === "delivered" ? input.deliveryDate || today : null;
  const estimatedDelivery = input.status !== "delivered" ? input.estimatedDelivery || today : null;

  insertOrderStatement.run({
    orderId,
    customer: input.customer,
    product: input.product,
    price: Number(input.price.toFixed(2)),
    status: input.status,
    deliveryDate,
    estimatedDelivery,
    createdAt: now.toISOString()
  });

  return {
    orderId,
    customer: input.customer,
    product: input.product,
    price: Number(input.price.toFixed(2)),
    status: input.status,
    ...(deliveryDate ? { delivery_date: deliveryDate } : {}),
    ...(estimatedDelivery ? { estimated_delivery: estimatedDelivery } : {})
  };
}
