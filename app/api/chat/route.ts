import { NextRequest, NextResponse } from "next/server";
import { buildSystemPrompt, PromptContext } from "@/app/lib/system-prompt";

/* ------------------------------------------------------------------ */
/*  DeepSeek API config                                                */
/* ------------------------------------------------------------------ */
const DEEPSEEK_BASE = "https://api.deepseek.com/v1";
const DEEPSEEK_MODEL = "deepseek-chat";
const TIMEOUT_MS = 12_000;
const MAX_OUTPUT_TOKENS = 150;

/* ------------------------------------------------------------------ */
/*  POST /api/chat                                                     */
/* ------------------------------------------------------------------ */
export async function POST(request: NextRequest) {
  /* --- 1. parse request --- */
  let body: {
    message: string;
    history?: { role: "user" | "assistant"; content: string }[];
    context?: PromptContext;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "invalid json body" },
      { status: 400 }
    );
  }

  const { message, history = [], context = {} } = body;

  if (!message || typeof message !== "string" || message.trim().length === 0) {
    return NextResponse.json(
      { error: "empty message" },
      { status: 400 }
    );
  }

  /* --- 2. check api key --- */
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    console.error("[pupu/api] DEEPSEEK_API_KEY not set");
    return NextResponse.json(
      { error: "api key not configured" },
      { status: 500 }
    );
  }

  /* --- 3. build system prompt --- */
  const systemPrompt = buildSystemPrompt(context);

  /* --- 4. call deepseek --- */
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${DEEPSEEK_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          ...history.slice(-12), // last 6 exchanges = 12 messages
          { role: "user", content: message }
        ],
        max_tokens: MAX_OUTPUT_TOKENS,
        temperature: 0.82,
        frequency_penalty: 0.25,
        presence_penalty: 0.15
      }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!res.ok) {
      const errText = await res.text().catch(() => "unknown");
      console.error(`[pupu/api] deepseek http ${res.status}: ${errText}`);
      return NextResponse.json(
        { error: `deepseek returned ${res.status}` },
        { status: 502 }
      );
    }

    /* --- 5. parse response --- */
    const data = await res.json();

    const reply: string | undefined =
      data?.choices?.[0]?.message?.content;

    if (!reply || typeof reply !== "string") {
      console.error("[pupu/api] unexpected deepseek shape", JSON.stringify(data).slice(0, 300));
      return NextResponse.json(
        { error: "unexpected response shape" },
        { status: 502 }
      );
    }

    return NextResponse.json({ reply: reply.trim() });
  } catch (err) {
    clearTimeout(timeout);
    const message =
      err instanceof Error && err.name === "AbortError"
        ? "timeout"
        : "fetch failed";
    console.error(`[pupu/api] ${message}`, err instanceof Error ? err.message : err);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
