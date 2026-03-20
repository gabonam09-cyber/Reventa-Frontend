"use client";

import { useState, useEffect } from "react";

/* ─── TYPES ─── */
type OrderStatus = "processing" | "shipped" | "delivered";
type ContactForm = { name: string; email: string; product: string; phone: string };
type ApiState = "idle" | "loading" | "success" | "error";
type CartItem = { id: number; name: string; price: string; emoji: string; qty: number };

/* ─── DATA ─── */
const slides = [
  {
    bg: "linear-gradient(135deg, #0D1B2A 0%, #1a2a1a 100%)",
    label: "NUEVA COLECCIÓN",
    title: "DROPS\nURBANOS",
    sub: "Ropa curada para quienes saben lo que quieren. Hoodies, cargos y piezas que dicen algo.",
    cta: "Ver Ropa",
    category: "ropa",
  },
  {
    bg: "linear-gradient(135deg, #0a0a14 0%, #0D1B2A 100%)",
    label: "APPLE ORIGINAL",
    title: "TECH\nPREMIUM",
    sub: "AirPods, iPhone, Apple Watch — originales, sellados, con garantía. Sin intermediarios raros.",
    cta: "Ver Apple",
    category: "apple",
  },
  {
    bg: "linear-gradient(135deg, #1a1000 0%, #0D1B2A 100%)",
    label: "ACCESORIOS",
    title: "GORRAS &\nBOCINAS",
    sub: "Gorras que completan el look. Bocinas que ponen el ambiente. Todo en un solo lugar.",
    cta: "Ver Todo",
    category: "todos",
  },
];

const products = [
  { id: 1, category: "apple", name: "AirPods Pro 2", price: "$3,499", tag: "Más vendido", emoji: "🎧" },
  { id: 2, category: "apple", name: "iPhone 15 Pro", price: "$18,999", tag: "Nuevo", emoji: "📱" },
  { id: 3, category: "apple", name: "Apple Watch S9", price: "$8,499", tag: "Stock limitado", emoji: "⌚" },
  { id: 4, category: "ropa", name: "Hoodie Oversized Negro", price: "$649", tag: "Drop actual", emoji: "🖤" },
  { id: 5, category: "ropa", name: "Cargo Pants Caqui", price: "$799", tag: "Trending", emoji: "👖" },
  { id: 6, category: "gorras", name: "Gorra Dad Hat Beige", price: "$299", tag: "Clásico", emoji: "🧢" },
  { id: 7, category: "gorras", name: "Gorra Snapback Negra", price: "$349", tag: "Nuevo drop", emoji: "🧢" },
  { id: 8, category: "bocinas", name: "JBL Flip 6", price: "$1,899", tag: "Favorita", emoji: "🔊" },
  { id: 9, category: "bocinas", name: "Marshall Emberton II", price: "$2,499", tag: "Premium", emoji: "🎵" },
];

const categoryLabels: Record<string, string> = {
  todos: "Todo", apple: "Apple", ropa: "Ropa", gorras: "Gorras", bocinas: "Bocinas",
};

const sports = [
  { name: "Apple", emoji: "🍎", category: "apple" },
  { name: "Streetwear", emoji: "👕", category: "ropa" },
  { name: "Gorras", emoji: "🧢", category: "gorras" },
  { name: "Audio", emoji: "🔊", category: "bocinas" },
  { name: "Accesorios", emoji: "⌚", category: "todos" },
  { name: "Drops", emoji: "🔥", category: "todos" },
  { name: "Tech", emoji: "📱", category: "apple" },
  { name: "Lifestyle", emoji: "✦", category: "todos" },
];

const testimonials = [
  { name: "Carlos M.", text: "Compré mis AirPods en 2 días, llegaron perfectos y con garantía. Sin duda vuelvo.", tag: "Apple" },
  { name: "Valeria R.", text: "La hoodie oversized está increíble, talla perfecto y el envío fue rápido.", tag: "Ropa" },
  { name: "Diego S.", text: "La bocina Marshall suena brutal, y el precio fue mejor que en cualquier tienda.", tag: "Bocinas" },
];

const faqs = [
  { q: "¿Los productos Apple son originales?", a: "Sí, todos nuestros productos Apple son 100% originales con caja sellada y garantía del fabricante." },
  { q: "¿Cómo hago mi pedido?", a: "Escríbenos por WhatsApp o Instagram con el producto que quieres. Te confirmamos disponibilidad y te damos los datos de pago." },
  { q: "¿Hacen envíos a todo México?", a: "Sí, enviamos a toda la república. Envío estándar 3-5 días, express 24-48 hrs." },
  { q: "¿Tienen garantía los productos?", a: "Todos los productos electrónicos incluyen garantía. La ropa y accesorios tienen cambio en 7 días si hay defecto de fábrica." },
];

export default function StorePage() {
  const [slide, setSlide] = useState(0);
  const [activeCategory, setActiveCategory] = useState("todos");
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [added, setAdded] = useState<number | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);

  // API States
  const [contactForm, setContactForm] = useState<ContactForm>({ name: "", email: "", product: "", phone: "" });
  const [contactState, setContactState] = useState<ApiState>("idle");
  const [contactMsg, setContactMsg] = useState("");
  const [orderState, setOrderState] = useState<ApiState>("idle");
  const [services, setServices] = useState<string[]>([]);

  useEffect(() => {
    const t = setInterval(() => setSlide(s => (s + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, []);

  // Fetch services on mount
  useEffect(() => {
    fetch("/api/services")
      .then(r => r.json())
      .then(data => setServices(data.services || []))
      .catch(() => {});
  }, []);

  // Submit contact / order to backend
  const handleContact = async (productName?: string) => {
    if (!contactForm.email) {
      setContactMsg("Ingresa tu correo para continuar.");
      setContactState("error");
      return;
    }

    setContactState("loading");

    try {
      // 1. Save lead
      const leadRes = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: contactForm.name,
          email: contactForm.email,
          company: contactForm.phone,
          goal: productName || contactForm.product,
        }),
      });
      const leadData = await leadRes.json();
      if (!leadData.ok) throw new Error(leadData.message);

      // 2. Create order if product specified
      if (productName) {
        const prod = products.find(p => p.name === productName);
        if (prod) {
          await fetch("/api/orders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              customer: contactForm.name || contactForm.email,
              product: prod.name,
              price: Number(prod.price.replace(/[^0-9]/g, "")),
              status: "processing" as OrderStatus,
            }),
          });
        }
      }

      setContactState("success");
      setContactMsg("¡Listo! Te contactamos en menos de 24 hrs por WhatsApp.");
      setContactForm({ name: "", email: "", product: "", phone: "" });
    } catch (err) {
      setContactState("error");
      setContactMsg(err instanceof Error ? err.message : "Error al enviar. Intenta de nuevo.");
    }
  };



  const filtered = activeCategory === "todos" ? products : products.filter(p => p.category === activeCategory);
  const addToCart = (p: typeof products[0]) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === p.id);
      if (existing) return prev.map(i => i.id === p.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { id: p.id, name: p.name, price: p.price, emoji: p.emoji, qty: 1 }];
    });
    setCartCount(c => c + 1);
    setAdded(p.id);
    setTimeout(() => setAdded(null), 1200);
  };

  const removeFromCart = (id: number) => {
    setCart(prev => {
      const item = prev.find(i => i.id === id);
      if (item && item.qty > 1) return prev.map(i => i.id === id ? { ...i, qty: i.qty - 1 } : i);
      return prev.filter(i => i.id !== id);
    });
    setCartCount(c => Math.max(0, c - 1));
  };

  const cartTotal = cart.reduce((sum, i) => sum + (Number(i.price.replace(/[^0-9]/g, '')) * i.qty), 0);

  const cur = slides[slide];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --gold: #D4AF6A;
          --gold-dim: #96773A;
          --gold-light: #F0D495;
          --navy: #0D1B2A;
          --bg: #070B10;
          --surface: #0F1820;
          --border: #1E2D3D;
          --text: #F0EDE6;
          --text-soft: #B8B0A0;
          --muted: #5A6470;
          --font-display: 'Syne', sans-serif;
          --font-body: 'DM Sans', sans-serif;
        }
        html { scroll-behavior: smooth; }
        body { background: var(--bg); color: var(--text); font-family: var(--font-body); overflow-x: hidden; }

        .topbar {
          background: var(--gold); color: #0a0800;
          text-align: center; padding: 9px 16px;
          font-size: 13px; font-weight: 600; letter-spacing: 0.03em;
        }
        .topbar b { font-weight: 800; }

        .nav {
          position: sticky; top: 0; z-index: 200;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 48px; height: 68px;
          background: rgba(7,11,16,0.97);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--border);
        }
        .nav-logo { font-family: var(--font-display); font-weight: 800; font-size: 22px; letter-spacing: -0.02em; }
        .nav-logo span { color: var(--gold); }
        .nav-links { display: flex; gap: 36px; }
        .nav-links a {
          font-size: 12px; color: var(--muted); text-decoration: none;
          letter-spacing: 0.12em; text-transform: uppercase; font-weight: 500;
          transition: color 0.2s;
        }
        .nav-links a:hover { color: var(--text); }
        .nav-right { display: flex; align-items: center; gap: 16px; }
        .nav-icon { background: none; border: none; color: var(--muted); font-size: 18px; cursor: pointer; transition: color 0.2s; }
        .nav-icon:hover { color: var(--text); }
        .cart-btn {
          background: var(--gold); border: none; padding: 9px 20px;
          font-family: var(--font-display); font-size: 12px; font-weight: 700;
          color: #0a0800; cursor: pointer; letter-spacing: 0.08em;
          text-transform: uppercase; transition: opacity 0.2s;
        }
        .cart-btn:hover { opacity: 0.85; }

        /* CART DRAWER */
        .cart-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.6);
          z-index: 999; backdrop-filter: blur(4px);
        }
        .cart-drawer {
          position: fixed; top: 0; right: 0; bottom: 0;
          width: min(420px, 100vw);
          background: var(--surface); z-index: 1000;
          display: flex; flex-direction: column;
          border-left: 1px solid var(--border);
          animation: slideIn 0.25s ease;
        }
        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        .cart-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 24px 28px; border-bottom: 1px solid var(--border);
        }
        .cart-header h3 { font-family: var(--font-display); font-size: 18px; font-weight: 800; }
        .cart-close { background: none; border: none; color: var(--muted); font-size: 24px; cursor: pointer; transition: color 0.2s; }
        .cart-close:hover { color: var(--text); }
        .cart-items { flex: 1; overflow-y: auto; padding: 20px 28px; display: flex; flex-direction: column; gap: 16px; }
        .cart-item {
          display: flex; align-items: center; gap: 16px;
          background: var(--bg); border: 1px solid var(--border);
          padding: 16px; border-radius: 8px;
        }
        .cart-item-emoji { font-size: 32px; }
        .cart-item-info { flex: 1; }
        .cart-item-name { font-family: var(--font-display); font-size: 14px; font-weight: 700; margin-bottom: 4px; }
        .cart-item-price { font-size: 16px; color: var(--gold-light); font-family: var(--font-display); }
        .cart-qty { display: flex; align-items: center; gap: 10px; }
        .qty-btn {
          width: 28px; height: 28px; border-radius: 50%;
          background: var(--surface2); border: 1px solid var(--border);
          color: var(--text); font-size: 16px; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s;
        }
        .qty-btn:hover { border-color: var(--gold); color: var(--gold); }
        .cart-footer {
          padding: 24px 28px; border-top: 1px solid var(--border);
          display: flex; flex-direction: column; gap: 16px;
        }
        .cart-total {
          display: flex; justify-content: space-between; align-items: center;
        }
        .cart-total span:first-child { font-size: 14px; color: var(--muted); }
        .cart-total span:last-child { font-family: var(--font-display); font-size: 22px; font-weight: 700; color: var(--gold-light); }
        .cart-wa-btn {
          background: #25D366; border: none; color: #fff;
          padding: 16px; font-family: var(--font-display);
          font-size: 13px; font-weight: 700; letter-spacing: 0.08em;
          text-transform: uppercase; cursor: pointer;
          transition: opacity 0.2s;
        }
        .cart-wa-btn:hover { opacity: 0.88; }
        .cart-empty { text-align: center; color: var(--muted); padding: 60px 0; font-size: 14px; }

        /* HERO */
        .hero-slider {
          position: relative; height: 88vh; min-height: 560px;
          overflow: hidden; display: flex; align-items: center; justify-content: center;
          transition: background 1s;
        }
        .hero-pattern {
          position: absolute; inset: 0; pointer-events: none;
          background-image:
            repeating-linear-gradient(0deg, transparent, transparent 80px, rgba(255,255,255,0.012) 80px, rgba(255,255,255,0.012) 81px),
            repeating-linear-gradient(90deg, transparent, transparent 80px, rgba(255,255,255,0.012) 80px, rgba(255,255,255,0.012) 81px);
        }
        .hero-giant {
          position: absolute; left: -10px; bottom: -30px;
          font-family: var(--font-display); font-size: clamp(140px, 20vw, 280px);
          font-weight: 800; color: rgba(255,255,255,0.028); line-height: 1;
          letter-spacing: -0.05em; pointer-events: none; user-select: none; white-space: nowrap;
        }
        .hero-wrap {
          position: relative; z-index: 10;
          padding: 0 48px; max-width: 720px; width: 100%; text-align: center; display: flex; flex-direction: column; align-items: center;
        }
        .hero-label {
          font-size: 11px; letter-spacing: 0.3em; text-transform: uppercase;
          color: var(--gold); margin-bottom: 16px; display: block;
        }
        .hero-title {
          font-family: var(--font-display); font-weight: 800;
          font-size: clamp(52px, 8vw, 110px); line-height: 0.9;
          letter-spacing: -0.04em; margin-bottom: 28px; white-space: pre-line;
        }
        .hero-sub {
          font-size: 16px; line-height: 1.7; color: var(--text-soft);
          margin-bottom: 36px; max-width: 480px; margin-left: auto; margin-right: auto;
        }
        .hero-cta {
          background: var(--text); color: #070B10; border: none;
          padding: 16px 40px; font-family: var(--font-display);
          font-size: 13px; font-weight: 700; letter-spacing: 0.1em;
          text-transform: uppercase; cursor: pointer; transition: background 0.2s, color 0.2s;
        }
        .hero-cta:hover { background: var(--gold); color: #0a0800; }
        .slider-btn {
          position: absolute; top: 50%; transform: translateY(-50%); z-index: 20;
          background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.1);
          color: var(--text); width: 48px; height: 48px; border-radius: 50%;
          font-size: 20px; display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.2s;
        }
        .slider-btn:hover { background: rgba(212,175,106,0.2); border-color: var(--gold); }
        .slider-btn.l { left: 24px; }
        .slider-btn.r { right: 24px; }
        .dots {
          position: absolute; bottom: 28px; left: 50%; transform: translateX(-50%);
          display: flex; gap: 10px; z-index: 20;
        }
        .dot { width: 28px; height: 3px; border: none; background: rgba(255,255,255,0.2); cursor: pointer; transition: all 0.3s; }
        .dot.on { background: var(--gold); width: 48px; }

        /* BENEFITS */
        .benefits {
          background: var(--navy); border-bottom: 1px solid var(--border);
          display: flex; justify-content: center; flex-wrap: wrap;
        }
        .benefit {
          display: flex; align-items: center; gap: 10px;
          padding: 18px 36px; border-right: 1px solid var(--border); font-size: 13px;
        }
        .benefit:last-child { border-right: none; }
        .benefit strong { color: var(--text); font-weight: 600; display: block; }
        .benefit span { color: var(--muted); font-size: 11px; }

        /* CATEGORIES */
        .cats { padding: 64px 48px 0; max-width: 1300px; margin: 0 auto; }
        .cats-h { font-family: var(--font-display); font-size: 28px; font-weight: 800; letter-spacing: -0.02em; margin-bottom: 32px; text-align: center; }
        .cats-row { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
        .cat-pill {
          display: flex; flex-direction: column; align-items: center; gap: 8px;
          background: var(--surface); border: 1px solid var(--border);
          padding: 18px 24px; cursor: pointer; transition: all 0.2s;
          font-size: 11px; color: var(--muted); font-family: var(--font-body);
          letter-spacing: 0.08em; text-transform: uppercase; min-width: 80px;
        }
        .cat-pill span { font-size: 26px; }
        .cat-pill:hover { border-color: var(--gold-dim); color: var(--text); }
        .cat-pill.active { border-color: var(--gold); color: var(--gold); background: rgba(212,175,106,0.08); }

        /* CATALOG */
        .catalog { padding: 48px 48px 96px; max-width: 1300px; margin: 0 auto; }
        .catalog-top {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 28px; flex-wrap: wrap; gap: 12px;
        }
        .catalog-label { font-family: var(--font-display); font-size: 12px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: var(--muted); }
        .filter-row { display: flex; gap: 6px; flex-wrap: wrap; }
        .filter-pill {
          background: transparent; border: 1px solid var(--border);
          color: var(--muted); padding: 7px 16px; font-size: 11px;
          font-family: var(--font-display); font-weight: 700;
          letter-spacing: 0.08em; text-transform: uppercase; cursor: pointer; transition: all 0.2s;
        }
        .filter-pill:hover { color: var(--text); border-color: var(--gold-dim); }
        .filter-pill.on { background: var(--gold); border-color: var(--gold); color: #0a0800; }
        .pgrid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 2px; }
        .pcard { background: var(--surface); padding: 36px 28px 28px; transition: background 0.2s; }
        .pcard:hover { background: #141f2c; }
        .pcard-emoji { font-size: 52px; margin-bottom: 20px; display: block; }
        .pcard-tag { font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; color: var(--gold); margin-bottom: 6px; display: block; }
        .pcard-name { font-family: var(--font-display); font-size: 17px; font-weight: 700; margin-bottom: 4px; line-height: 1.2; }
        .pcard-price { font-family: var(--font-display); font-size: 26px; font-weight: 300; color: var(--gold-light); margin: 10px 0 20px; }
        .pcard-btn {
          width: 100%; background: transparent; border: 1px solid var(--border);
          color: var(--text-soft); padding: 12px; font-size: 11px;
          font-family: var(--font-display); font-weight: 700; letter-spacing: 0.1em;
          text-transform: uppercase; cursor: pointer; transition: all 0.2s;
        }
        .pcard-btn:hover { background: var(--gold); color: #0a0800; border-color: var(--gold); }
        .pcard-btn.ok { background: #0d2a1a; border-color: #1a5a30; color: #4ecba8; }

        /* HOW */
        .how { background: var(--navy); border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); padding: 96px 48px; }
        .how-in { max-width: 1300px; margin: 0 auto; }
        .eyebrow { font-size: 11px; letter-spacing: 0.3em; text-transform: uppercase; color: var(--gold); margin-bottom: 12px; }
        .sh2 { font-family: var(--font-display); font-size: clamp(28px, 4vw, 52px); font-weight: 800; letter-spacing: -0.02em; margin-bottom: 56px; }
        .steps { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); border: 1px solid var(--border); }
        .step { padding: 36px 28px; border-right: 1px solid var(--border); }
        .step:last-child { border-right: none; }
        .sn { font-family: var(--font-display); font-size: 56px; font-weight: 800; color: rgba(212,175,106,0.1); line-height: 1; margin-bottom: 14px; }
        .st { font-family: var(--font-display); font-size: 14px; font-weight: 700; margin-bottom: 8px; }
        .sd { font-size: 12px; color: var(--muted); line-height: 1.6; }

        /* TESTI */
        .testi { padding: 96px 48px; max-width: 1300px; margin: 0 auto; }
        .tgrid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 2px; }
        .tcard { background: var(--surface); padding: 36px 32px; transition: background 0.2s; }
        .tcard:hover { background: #141f2c; }
        .tstars { color: var(--gold); font-size: 13px; margin-bottom: 16px; letter-spacing: 3px; }
        .ttext { font-size: 15px; line-height: 1.7; color: var(--text-soft); margin-bottom: 24px; font-style: italic; }
        .tauthor { display: flex; align-items: center; gap: 12px; }
        .tavatar { width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, var(--gold), var(--gold-dim)); display: grid; place-items: center; font-size: 13px; font-weight: 700; color: #0a0800; }
        .tname { font-size: 14px; font-weight: 600; }
        .ttag { font-size: 11px; color: var(--muted); }

        /* REFERIDOS */
        .ref {
          margin: 0 48px 96px;
          background: linear-gradient(135deg, #1a1200, var(--navy));
          border: 1px solid var(--gold-dim); padding: 48px;
          display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 24px;
        }
        .ref-title { font-family: var(--font-display); font-size: clamp(20px, 3vw, 32px); font-weight: 800; margin-bottom: 8px; }
        .ref p { color: var(--text-soft); font-size: 14px; }
        .btn-gold {
          background: linear-gradient(135deg, #E8C87A, var(--gold)); color: #0a0800;
          border: none; padding: 16px 36px; font-family: var(--font-display);
          font-size: 13px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
          cursor: pointer; white-space: nowrap; box-shadow: 0 4px 20px rgba(212,175,106,0.25);
          transition: opacity 0.2s;
        }
        .btn-gold:hover { opacity: 0.88; }

        /* FAQ */
        .faq { background: var(--navy); border-top: 1px solid var(--border); padding: 96px 48px; }
        .faq-in { max-width: 800px; margin: 0 auto; }
        .fitem { border-bottom: 1px solid var(--border); }
        .fq {
          width: 100%; background: none; border: none; color: var(--text); text-align: left;
          padding: 22px 0; font-family: var(--font-body); font-size: 16px; font-weight: 500;
          cursor: pointer; display: flex; justify-content: space-between; align-items: center; transition: color 0.2s;
        }
        .fq:hover { color: var(--gold); }
        .fa { padding: 0 0 20px; font-size: 14px; color: var(--text-soft); line-height: 1.7; }

        /* CTA */
        .cta {
          padding: 120px 48px; text-align: center;
          background: radial-gradient(ellipse 80% 60% at 50% 0%, rgba(212,175,106,0.1) 0%, transparent 70%), var(--bg);
        }
        .cta-h { font-family: var(--font-display); font-size: clamp(36px, 6vw, 72px); font-weight: 800; letter-spacing: -0.03em; margin-bottom: 16px; line-height: 1; }
        .cta-h span { color: var(--gold); }
        .cta p { color: var(--text-soft); font-size: 16px; margin-bottom: 48px; }
        .crow { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; }
        .cchip {
          display: flex; align-items: center; gap: 10px;
          background: var(--surface); border: 1px solid var(--border);
          padding: 16px 28px; font-size: 14px; color: var(--text); text-decoration: none;
          font-family: var(--font-display); font-weight: 600; letter-spacing: 0.05em;
          transition: border-color 0.2s, color 0.2s;
        }
        .cchip:hover { border-color: var(--gold); color: var(--gold); }

        footer { background: var(--navy); border-top: 1px solid var(--border); padding: 48px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; }
        .flogo { font-family: var(--font-display); font-weight: 800; font-size: 18px; }
        .flogo span { color: var(--gold); }
        footer p { font-size: 12px; color: var(--muted); }

        @media (max-width: 768px) {
          .nav { padding: 0 20px; }
          .nav-links { display: none; }
          .hero-wrap { padding: 0 24px; text-align: center; }
          .hero-sub { margin: 0 auto 36px; }
          .cats, .catalog, .testi { padding-left: 20px; padding-right: 20px; }
          .ref { margin: 0 20px 64px; padding: 28px 20px; }
          .how, .faq { padding-left: 20px; padding-right: 20px; }
          .benefit { padding: 16px 20px; }
          .steps { grid-template-columns: 1fr 1fr; }
          .step { border-bottom: 1px solid var(--border); }
        }
      `}</style>

      {/* TOPBAR */}
      <div className="topbar">
        <b>Envío gratis</b> en compras de $1,599 · 3 MSI con PayPal y Mercado Pago
      </div>

      {/* NAV */}
      <nav className="nav">
        <div className="nav-logo">ANUBIS<span>.</span></div>
        <div className="nav-links">
          <a href="#catalogo">Lo Nuevo</a>
          <a href="#catalogo">Apple</a>
          <a href="#catalogo">Gorras</a>
          <a href="#catalogo">Ropa</a>
          <a href="#catalogo">Bocinas</a>
        </div>
        <div className="nav-right">
          <button className="nav-icon">🔍</button>
          <button className="nav-icon">♡</button>
          <button className="cart-btn" onClick={() => setCartOpen(true)}>🛒 {cartCount > 0 ? `(${cartCount})` : "Carrito"}</button>
        </div>
      </nav>

      {/* HERO SLIDER */}
      <section className="hero-slider" style={{ background: cur.bg }}>
        <div className="hero-pattern" />
        <div className="hero-giant">ANUBIS</div>
        <div className="hero-wrap">
          <span className="hero-label">{cur.label}</span>
          <h1 className="hero-title">{cur.title}</h1>
          <p className="hero-sub">{cur.sub}</p>
          <button className="hero-cta" onClick={() => { setActiveCategory(cur.category); document.getElementById("catalogo")?.scrollIntoView({ behavior: "smooth" }); }}>
            {cur.cta} →
          </button>
        </div>
        <button className="slider-btn l" onClick={() => setSlide(s => (s - 1 + slides.length) % slides.length)}>‹</button>
        <button className="slider-btn r" onClick={() => setSlide(s => (s + 1) % slides.length)}>›</button>
        <div className="dots">
          {slides.map((_, i) => <button key={i} className={`dot${slide === i ? " on" : ""}`} onClick={() => setSlide(i)} />)}
        </div>
      </section>

      {/* BENEFITS */}
      <div className="benefits">
        {[
          { icon: "✅", l: "100% Originales", s: "Caja sellada + garantía" },
          { icon: "⚡", l: "Entrega 24–48 hrs", s: "Express disponible" },
          { icon: "💬", l: "Atención Directa", s: "WhatsApp e Instagram" },
          { icon: "🔁", l: "Cambios en 7 días", s: "Si hay defecto de fábrica" },
          { icon: "🇲🇽", l: "Todo México", s: "Envíos a cualquier estado" },
        ].map(b => (
          <div className="benefit" key={b.l}>
            <span style={{ fontSize: 20 }}>{b.icon}</span>
            <div><strong>{b.l}</strong><span>{b.s}</span></div>
          </div>
        ))}
      </div>

      {/* CATEGORIES */}
      <div className="cats">
        <p className="cats-h">EXPLORA</p>
        <div className="cats-row">
          {sports.map(s => (
            <button
              className={`cat-pill${activeCategory === s.category && s.category !== "todos" ? " active" : ""}`}
              key={s.name}
              onClick={() => {
                setActiveCategory(s.category);
                document.getElementById("catalogo")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              <span>{s.emoji}</span>{s.name}
            </button>
          ))}
        </div>
      </div>

      {/* CATALOG */}
      <div id="catalogo" className="catalog">
        <div className="catalog-top">
          <p className="catalog-label">Catálogo — {categoryLabels[activeCategory]}</p>
        </div>
        <div className="pgrid">
          {filtered.map(p => (
            <div className="pcard" key={p.id}>
              <span className="pcard-emoji">{p.emoji}</span>
              <span className="pcard-tag">{p.tag}</span>
              <p className="pcard-name">{p.name}</p>
              <p className="pcard-price">{p.price}</p>
              <button className={`pcard-btn${added === p.id ? " ok" : ""}`} onClick={() => addToCart(p)}>
                {added === p.id ? "✓ Agregado" : "Añadir al carrito"}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* HOW TO BUY */}
      <div className="how">
        <div className="how-in">
          <p className="eyebrow">Sin complicaciones</p>
          <h2 className="sh2">¿Cómo comprar?</h2>
          <div className="steps">
            {[
              { n: "01", t: "Elige tu producto", d: "Navega el catálogo y decide qué quieres." },
              { n: "02", t: "Escríbenos", d: "WhatsApp o DM en Instagram. Te respondemos rápido." },
              { n: "03", t: "Confirmamos stock", d: "Precio final con envío incluido." },
              { n: "04", t: "Haces tu pago", d: "Transferencia, depósito o efectivo." },
              { n: "05", t: "Lo enviamos", d: "Número de rastreo ese mismo día." },
              { n: "06", t: "Lo recibes", d: "Recíbelo. Si algo falla, aquí estamos." },
            ].map(s => (
              <div className="step" key={s.n}>
                <p className="sn">{s.n}</p>
                <p className="st">{s.t}</p>
                <p className="sd">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TESTIMONIALS */}
      <div className="testi">
        <p className="eyebrow">Clientes reales</p>
        <h2 className="sh2">Lo que dicen de nosotros</h2>
        <div className="tgrid">
          {testimonials.map((t, i) => (
            <div className="tcard" key={i}>
              <p className="tstars">★★★★★</p>
              <p className="ttext">"{t.text}"</p>
              <div className="tauthor">
                <div className="tavatar">{t.name[0]}</div>
                <div><p className="tname">{t.name}</p><p className="ttag">{t.tag}</p></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* REFERIDOS */}
      <div className="ref">
        <div>
          <p style={{ color: "var(--gold)", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 8 }}>Programa de referidos</p>
          <p className="ref-title">Recomienda y gana <span style={{ color: "var(--gold)" }}>$100 de crédito</span></p>
          <p>Por cada amigo que compre con tu recomendación, te damos descuento en tu próxima compra.</p>
        </div>
        <button className="btn-gold">Quiero Referir →</button>
      </div>

      {/* FAQ */}
      <div className="faq">
        <div className="faq-in">
          <p className="eyebrow">Preguntas frecuentes</p>
          <h2 className="sh2">Resolvemos tus dudas</h2>
          {faqs.map((f, i) => (
            <div className="fitem" key={i}>
              <button className="fq" onClick={() => setActiveFaq(activeFaq === i ? null : i)}>
                {f.q}
                <span style={{ color: "var(--gold)", fontSize: 22 }}>{activeFaq === i ? "−" : "+"}</span>
              </button>
              {activeFaq === i && <p className="fa">{f.a}</p>}
            </div>
          ))}
        </div>
      </div>

      {/* CTA FINAL */}
      <div id="contacto" className="cta">
        <h2 className="cta-h">¿Listo para tu <span>pedido</span>?</h2>
        <p>Déjanos tu info y te contactamos en menos de 24 hrs.</p>

        <div style={{ maxWidth: 480, margin: "0 auto 40px", display: "flex", flexDirection: "column", gap: 12 }}>
          <input
            type="text"
            placeholder="Tu nombre"
            value={contactForm.name}
            onChange={e => setContactForm(f => ({ ...f, name: e.target.value }))}
            style={{
              background: "var(--surface)", border: "1px solid var(--border)",
              color: "var(--text)", padding: "14px 18px", fontSize: 14,
              fontFamily: "var(--font-body)", outline: "none", width: "100%",
            }}
          />
          <input
            type="email"
            placeholder="Tu correo *"
            value={contactForm.email}
            onChange={e => setContactForm(f => ({ ...f, email: e.target.value }))}
            style={{
              background: "var(--surface)", border: `1px solid ${contactState === "error" ? "#c0392b" : "var(--border)"}`,
              color: "var(--text)", padding: "14px 18px", fontSize: 14,
              fontFamily: "var(--font-body)", outline: "none", width: "100%",
            }}
          />
          <input
            type="text"
            placeholder="¿Qué producto te interesa?"
            value={contactForm.product}
            onChange={e => setContactForm(f => ({ ...f, product: e.target.value }))}
            style={{
              background: "var(--surface)", border: "1px solid var(--border)",
              color: "var(--text)", padding: "14px 18px", fontSize: 14,
              fontFamily: "var(--font-body)", outline: "none", width: "100%",
            }}
          />
          <div style={{ position: "relative" }}>
            <span style={{
              position: "absolute", left: 18, top: "50%", transform: "translateY(-50%)",
              color: "var(--muted)", fontSize: 14, pointerEvents: "none",
            }}>+52</span>
            <input
              type="tel"
              placeholder="Tu número de WhatsApp"
              value={contactForm.phone}
              onChange={e => {
                const val = e.target.value.replace(/[^0-9]/g, "").slice(0, 10);
                setContactForm(f => ({ ...f, phone: val }));
              }}
              style={{
                background: "var(--surface)",
                border: `1px solid ${contactForm.phone.length > 0 && contactForm.phone.length < 10 ? "#e67e22" : "var(--border)"}`,
                color: "var(--text)", padding: "14px 18px 14px 52px", fontSize: 14,
                fontFamily: "var(--font-body)", outline: "none", width: "100%",
              }}
            />
            {contactForm.phone.length === 10 && (
              <span style={{
                position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
                color: "#4ecba8", fontSize: 16,
              }}>✓</span>
            )}
          </div>
          <p style={{ fontSize: 11, color: "var(--muted)", textAlign: "left", marginTop: -4 }}>
            📲 Tu agente de WhatsApp te enviará info del producto automáticamente
          </p>
          <button
            onClick={() => handleContact()}
            disabled={contactState === "loading"}
            style={{
              background: contactState === "loading" ? "var(--gold-dim)" : "linear-gradient(135deg, #E8C87A, var(--gold))",
              color: "#0a0800", border: "none", padding: "16px",
              fontFamily: "var(--font-display)", fontSize: 13, fontWeight: 700,
              letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer",
              opacity: contactState === "loading" ? 0.7 : 1,
            }}
          >
            {contactState === "loading" ? "Enviando..." : "Quiero que me contacten →"}
          </button>

          {contactMsg && (
            <p style={{
              fontSize: 13, textAlign: "center", padding: "10px",
              color: contactState === "success" ? "#4ecba8" : "#e74c3c",
              background: contactState === "success" ? "rgba(78,203,168,0.08)" : "rgba(231,76,60,0.08)",
              border: `1px solid ${contactState === "success" ? "rgba(78,203,168,0.3)" : "rgba(231,76,60,0.3)"}`,
            }}>
              {contactMsg}
            </p>
          )}
        </div>

        <div className="crow">
          <a className="cchip" href="https://wa.me/5553405555" target="_blank" rel="noopener noreferrer">💬 WhatsApp</a>
          <a className="cchip" href="https://instagram.com" target="_blank" rel="noopener noreferrer">📸 Instagram</a>
          <a className="cchip" href="mailto:hola@anubis.mx">✉️ Email</a>
        </div>
      </div>

      {/* CART DRAWER */}
      {cartOpen && (
        <>
          <div className="cart-overlay" onClick={() => setCartOpen(false)} />
          <div className="cart-drawer">
            <div className="cart-header">
              <h3>🛒 Tu carrito {cartCount > 0 ? `(${cartCount})` : ""}</h3>
              <button className="cart-close" onClick={() => setCartOpen(false)}>×</button>
            </div>

            <div className="cart-items">
              {cart.length === 0 ? (
                <p className="cart-empty">Tu carrito está vacío 🛒<br />Agrega productos para continuar.</p>
              ) : (
                cart.map(item => (
                  <div className="cart-item" key={item.id}>
                    <span className="cart-item-emoji">{item.emoji}</span>
                    <div className="cart-item-info">
                      <p className="cart-item-name">{item.name}</p>
                      <p className="cart-item-price">{item.price}</p>
                    </div>
                    <div className="cart-qty">
                      <button className="qty-btn" onClick={() => removeFromCart(item.id)}>−</button>
                      <span style={{ fontSize: 14, minWidth: 16, textAlign: "center" }}>{item.qty}</span>
                      <button className="qty-btn" onClick={() => addToCart(products.find(p => p.id === item.id)!)}>+</button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="cart-footer">
                <div className="cart-total">
                  <span>Total</span>
                  <span>${cartTotal.toLocaleString("es-MX")}</span>
                </div>
                <button
                  className="cart-wa-btn"
                  onClick={() => {
                    const items = cart.map(i => `• ${i.name} x${i.qty} (${i.price})`).join("\n");
                    const msg = encodeURIComponent(`Hola! Quiero pedir:\n${items}\n\nTotal: $${cartTotal.toLocaleString("es-MX")}`);
                    window.open(`https://wa.me/5553405555?text=${msg}`, "_blank");
                  }}
                >
                  💬 Pedir por WhatsApp
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* FOOTER */}
      <footer>
        <div className="flogo">ANUBIS<span>.</span></div>
        <p>Ropa · Apple · Gorras · Bocinas — Estilo y tecnología en tus manos.</p>
        <p>© 2025 Anubis. Todos los derechos reservados.</p>
      </footer>
    </>
  );
}