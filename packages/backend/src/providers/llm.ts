// OpenAI-compatible chat calls, always through receipts. One model is enough: `default` is whatever the
// deployment names in LLM_BASE_URL / LLM_API_KEY / LLM_MODEL, and every capability uses it unless the
// site, an environment variable or the admin's model page picks one of the site's named presets
// (site/models.ts).
import type { z } from "zod";
import { PRESETS } from "@aihot/site/models";
import { config, credential } from "../config.ts";
import { sha256 } from "../lib/ids.ts";
import { shutdownSignal } from "../lib/shutdown.ts";
import { assertAccepted, BudgetExceededError, paidRequest, ProviderRejectedError, rejectReceivedResponse } from "./receipts.ts";

export interface ModelSpec {
  key: string;
  service: string;
  model: string;
  baseUrlEnv: string;
  apiKeyEnv: string;
  /** Extra request fields, e.g. switching reasoning off for short structured tasks. */
  extra?: Record<string, unknown>;
  /** Output tokens added to every call's own limit for a reasoning model, which reasons before it answers. */
  reasoningTokens?: number;
  jsonMode: boolean;
  vision?: boolean;
}

function extraFromEnv(value: string | undefined): Record<string, unknown> | undefined {
  if (!value) return undefined;
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error("LLM_EXTRA_JSON must be a JSON object, e.g. {\"enable_thinking\": false}");
  }
  // A string or array would spread into numbered request-body keys instead of provider parameters.
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("LLM_EXTRA_JSON must be a JSON object, e.g. {\"enable_thinking\": false}");
  }
  return parsed as Record<string, unknown>;
}

// Some relays route by an extra header (opencode-go wants x-opencode-session). Parsed once; an empty
// object keeps the common direct-endpoint path allocation-free.
let extraHeadersCache: Record<string, string> | null = null;
function extraHeadersFromEnv(): Record<string, string> {
  if (extraHeadersCache === null) {
    const raw = process.env.LLM_EXTRA_HEADERS;
    if (!raw) extraHeadersCache = {};
    else {
      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch {
        throw new Error("LLM_EXTRA_HEADERS must be a JSON object of header name to value");
      }
      // A shape a relay cannot use must fail before the request, not as a failed attempt.
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("LLM_EXTRA_HEADERS must be a JSON object of header name to value");
      }
      for (const value of Object.values(parsed)) if (typeof value !== "string") throw new Error("LLM_EXTRA_HEADERS must be a JSON object of header name to value");
      extraHeadersCache = parsed as Record<string, string>;
    }
  }
  return extraHeadersCache;
}

function reasoningTokensFromEnv(value: string | undefined): number | undefined {
  if (!value) return undefined;
  if (!/^\d+$/.test(value)) throw new Error("LLM_REASONING_TOKENS must be a non-negative integer, e.g. 4000");
  return Number(value);
}

export const MODELS: Record<string, ModelSpec> = {
  // Read from the environment at call time.
  default: {
    key: "default", service: "llm", baseUrlEnv: "LLM_BASE_URL", apiKeyEnv: "LLM_API_KEY",
    get model() { return process.env.LLM_MODEL ?? ""; },
    get extra() { return extraFromEnv(process.env.LLM_EXTRA_JSON); },
    get reasoningTokens() { return reasoningTokensFromEnv(process.env.LLM_REASONING_TOKENS); },
    get jsonMode() { return process.env.LLM_JSON_MODE !== "false"; },
    get vision() { return process.env.LLM_VISION === "true"; },
  },
  // The pack's named presets, each with its own address and key.
  ...Object.fromEntries(Object.entries(PRESETS).map(([key, preset]) => [key, { key, ...preset }])),
};

export type ContentPart = { type: "text"; text: string } | { type: "image_url"; image_url: { url: string } };

export interface ChatJsonOptions<S extends z.ZodType> {
  model: string;
  purpose: string;
  subject: string;
  promptVersion: string;
  system: string;
  user: string | ContentPart[];
  schema: S;
  temperature?: number;
  maxTokens?: number;
  attemptTag?: string;
  timeoutMs?: number;
  /** false: the model answers in its own text format (no JSON mode); `parse` turns it into the schema's input. */
  json?: boolean;
  parse?: (content: string) => unknown;
}

export interface ChatJsonResult<T> {
  data: T;
  receiptId: number;
  reused: boolean;
  model: string;
  usage: Record<string, unknown> | null;
  /** Set when the selected model's provider refused and LLM_FALLBACK_MODEL answered instead. */
  fallbackFrom?: string;
}

export class ModelOutputError extends Error {
  readonly receiptId: number | null;
  constructor(message: string, receiptId: number | null = null) {
    super(message);
    this.receiptId = receiptId;
  }
}

function extractJson(text: string): unknown {
  let t = text.trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(t);
  if (fence) t = fence[1]!;
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start === -1 || end === -1) throw new ModelOutputError("No JSON object in model output");
  const body = t.slice(start, end + 1);
  try {
    return JSON.parse(body);
  } catch {
    return JSON.parse(escapeControlCharsInStrings(body));
  }
}

/** Models sometimes emit raw newlines or tabs inside JSON strings (multi-line posts); escape only those. */
export function escapeControlCharsInStrings(json: string): string {
  let out = "";
  let inString = false;
  let escaped = false;
  for (const ch of json) {
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      else if (ch < " ") {
        out += ch === "\n" ? "\\n" : ch === "\r" ? "\\r" : ch === "\t" ? "\\t" : `\\u${ch.charCodeAt(0).toString(16).padStart(4, "0")}`;
        continue;
      }
    } else if (ch === '"') inString = true;
    out += ch;
  }
  return out;
}

function isConnectFailure(error: unknown): boolean {
  const code = (error as { cause?: { code?: string } })?.cause?.code ?? (error as { code?: string })?.code;
  return ["ECONNREFUSED", "ENOTFOUND", "EAI_AGAIN", "UND_ERR_CONNECT_TIMEOUT", "CERT_HAS_EXPIRED"].includes(code ?? "");
}

/** The chosen model's endpoint is incomplete; unlike a provider refusal, no receipt was spent. */
export class ModelNotConfiguredError extends Error {}

interface ConfiguredModel {
  spec: ModelSpec;
  baseUrl: string;
  apiKey: string;
}

function configure(key: string): ConfiguredModel {
  const spec = MODELS[key];
  if (!spec) throw new Error(`Unknown model ${key}`);
  const baseUrl = credential("models", spec.baseUrlEnv);
  const apiKey = credential("models", spec.apiKeyEnv);
  if (!baseUrl || !apiKey || !spec.model) throw new ModelNotConfiguredError(`Model ${key} is not configured (${spec.baseUrlEnv}, ${spec.apiKeyEnv}${spec.key === "default" ? ", LLM_MODEL" : ""})`);
  return { spec, baseUrl, apiKey };
}

/**
 * LLM_FALLBACK_MODEL: a registered model that takes over when the chosen one's provider refuses or is
 * unreachable. Read at call time, like the default model's environment.
 */
export function configuredFallbackModel(primary?: string): string | null {
  const key = process.env.LLM_FALLBACK_MODEL?.trim();
  return key && key !== primary ? key : null;
}

/** Whether the configured fallback belongs to another service than this one (for alert wording). */
export function fallbackCoversService(service: string): boolean {
  const key = configuredFallbackModel();
  return !!key && MODELS[key] !== undefined && MODELS[key]!.service !== service;
}

function fallbackFor(primary: string): string | null {
  const key = configuredFallbackModel(primary);
  if (key && !MODELS[key]) throw new Error(`LLM_FALLBACK_MODEL names unknown model ${key}`);
  return key;
}

/**
 * A refusal or an unreachable provider may be tried elsewhere. An unknown outcome (the provider may
 * have billed it) and unusable output (the provider answered) stay with the chosen model.
 */
function shouldFallBack(error: unknown): boolean {
  if (shutdownSignal.signal.aborted) return false;
  if (error instanceof ModelNotConfiguredError || error instanceof BudgetExceededError) return true;
  if (error instanceof ProviderRejectedError) {
    // A provider's content filter is a decision about the material, not an outage.
    return error.retryable || !/contentFilter|"1301"/.test(error.message);
  }
  return false;
}

async function callModel<S extends z.ZodType>(opts: ChatJsonOptions<S>, { spec, baseUrl, apiKey }: ConfiguredModel, stripImages = false): Promise<ChatJsonResult<z.infer<S>>> {
  const temperature = opts.temperature ?? 0.2;
  const maxTokens = Math.max(opts.maxTokens ?? 1500, 512) + (spec.reasoningTokens ?? 0);
  // A fallback that cannot read images still answers the text part; these prompts always carry one.
  const user = stripImages && Array.isArray(opts.user) ? opts.user.filter((part) => part.type === "text") : opts.user;
  const userText = typeof user === "string" ? user : JSON.stringify(user);
  const body: Record<string, unknown> = {
    model: spec.model,
    messages: [
      // A prompt given as one user message (the title/summary prompts) has no system message.
      ...(opts.system ? [{ role: "system", content: opts.system }] : []),
      // Multimodal parts go through as parts; plain objects are sent as JSON text.
      { role: "user", content: user },
    ],
    temperature,
    max_tokens: maxTokens,
    ...(spec.jsonMode && opts.json !== false ? { response_format: { type: "json_object" } } : {}),
    ...(spec.extra ?? {}),
  };

  // Read before the receipt: a malformed LLM_EXTRA_HEADERS must not spend an attempt or a budget slot.
  const extraHeaders = extraHeadersFromEnv();
  const receipt = await paidRequest(
    {
      service: spec.service,
      model: spec.model,
      purpose: opts.purpose,
      subject: opts.subject,
      identity: { model: spec.model, promptVersion: opts.promptVersion, system: sha256(opts.system), user: sha256(userText), temperature, maxTokens, extra: spec.extra ?? null },
      requestSummary: { promptVersion: opts.promptVersion, systemHash: sha256(opts.system), userHash: sha256(userText), userChars: userText.length, temperature, maxTokens },
      attemptTag: opts.attemptTag,
    },
    async () => {
      const started = Date.now();
      let res: Response;
      try {
        res = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
          method: "POST",
          headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}`, ...extraHeaders },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(opts.timeoutMs ?? 120_000),
        });
      } catch (error) {
        if (isConnectFailure(error)) throw new ProviderRejectedError(`connect failed: ${String(error)}`, null, true);
        throw error;
      }
      const text = await res.text();
      assertAccepted(spec.service, res.status, text);
      let json: Record<string, unknown>;
      try {
        json = JSON.parse(text);
        if (!json || typeof json !== "object" || Array.isArray(json)) throw new Error("Expected a response object");
      } catch {
        json = { unparsable: text.slice(0, 20000) };
      }
      const usage = (json.usage as Record<string, unknown> | undefined) ?? null;
      return {
        response: { ...json, _latencyMs: Date.now() - started },
        requestId: (json.id as string | undefined) ?? res.headers.get("x-request-id"),
        usage,
        cost: null,
      };
    },
  );

  const response = receipt.response as { choices?: Array<{ message?: { content?: string }; finish_reason?: string }>; usage?: Record<string, unknown> };
  const content = response.choices?.[0]?.message?.content ?? "";
  let parsed: z.infer<S>;
  try {
    parsed = opts.schema.parse(opts.parse ? opts.parse(content) : extractJson(content));
  } catch (error) {
    // Unusable output: record it and let a later attempt pay for a fresh answer. A reasoning model that
    // reasoned up to the output limit leaves an empty or cut-off answer; say so, and where to give it room.
    const detail = response.choices?.[0]?.finish_reason === "length"
      ? `output token limit reached (finish_reason=length): a reasoning model may have spent it reasoning; give it room with ${spec.key === "default" ? "LLM_REASONING_TOKENS" : `reasoningTokens on preset ${spec.key}`}. ${String(error)}`
      : String(error);
    await rejectReceivedResponse(receipt.receiptId, `unusable output: ${detail.slice(0, 500)}`);
    throw new ModelOutputError(`Model ${spec.key} returned unusable output for ${opts.subject}: ${detail.slice(0, 300)}`, receipt.receiptId);
  }
  return { data: parsed, receiptId: receipt.receiptId, reused: receipt.reused, model: spec.key, usage: response.usage ?? null };
}

export async function chatJson<S extends z.ZodType>(opts: ChatJsonOptions<S>): Promise<ChatJsonResult<z.infer<S>>> {
  if (!config.modelCallsEnabled) throw new Error("Model calls are disabled (MODEL_CALLS_ENABLED=false)");
  // An invalid fallback name is a configuration error: fail before spending a receipt.
  const fallback = fallbackFor(opts.model);
  try {
    return await callModel(opts, configure(opts.model));
  } catch (error) {
    if (!fallback || !shouldFallBack(error)) throw error;
    // The backup's own error is the one worth reporting; both providers are named in the receipts.
    const result = await callModel(opts, configure(fallback), MODELS[fallback]!.vision !== true);
    return { ...result, fallbackFrom: opts.model };
  }
}
