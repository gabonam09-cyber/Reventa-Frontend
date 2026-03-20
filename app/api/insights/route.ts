import { NextResponse } from "next/server";

type StrategyCard = {
  title: string;
  description: string;
};

const fallbackCards: StrategyCard[] = [
  {
    title: "Estrategia de Marca",
    description: "Posicionamiento, tono y narrativa para diferenciarte."
  },
  {
    title: "Funnel Full-Funnel",
    description: "Desde awareness hasta cierre con seguimiento real."
  },
  {
    title: "Data en Tiempo Real",
    description: "Medimos cada decision en un dashboard accionable."
  }
];

function sanitizeCards(cards: unknown): StrategyCard[] {
  if (!Array.isArray(cards) || cards.length !== 3) {
    return fallbackCards;
  }

  const parsed = cards
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const title = String((item as { title?: unknown }).title || "").trim();
      const description = String((item as { description?: unknown }).description || "").trim();

      if (!title || !description) {
        return null;
      }

      return {
        title: title.slice(0, 50),
        description: description.slice(0, 160)
      };
    })
    .filter((item): item is StrategyCard => item !== null);

  return parsed.length === 3 ? parsed : fallbackCards;
}

export async function POST() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ cards: fallbackCards, source: "fallback", reason: "missing_api_key" });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        input: [
          {
            role: "system",
            content:
              "Responde en JSON estricto con 3 tarjetas para una agencia de marketing digital en espanol."
          },
          {
            role: "user",
            content:
              "Genera un objeto JSON con la clave cards (array de 3 objetos). Cada objeto debe tener title y description, breve y accionable."
          }
        ],
        max_output_tokens: 260,
        text: {
          format: {
            type: "json_schema",
            name: "strategy_cards",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                cards: {
                  type: "array",
                  minItems: 3,
                  maxItems: 3,
                  items: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      title: { type: "string" },
                      description: { type: "string" }
                    },
                    required: ["title", "description"]
                  }
                }
              },
              required: ["cards"]
            }
          }
        }
      })
    });

    if (!response.ok) {
      return NextResponse.json({ cards: fallbackCards, source: "fallback", reason: "openai_error" });
    }

    const data = (await response.json()) as { output_text?: string };
    const outputText = data.output_text || "";

    if (!outputText) {
      return NextResponse.json({ cards: fallbackCards, source: "fallback", reason: "empty_output" });
    }

    const parsed = JSON.parse(outputText) as { cards?: unknown };
    return NextResponse.json({ cards: sanitizeCards(parsed.cards), source: "gpt" });
  } catch {
    return NextResponse.json({ cards: fallbackCards, source: "fallback", reason: "unexpected" });
  }
}
