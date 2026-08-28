const RESEND_API_BASE = "https://api.resend.com";

/**
 * Error carrying Resend's own status and message so routes can surface the
 * real cause in the admin page instead of a generic failure.
 */
export class ResendError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ResendError";
    this.status = status;
  }
}

function apiKey(): string {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new ResendError(0, "RESEND_API_KEY secret is not set");
  }
  return key;
}

async function resendFetch(
  path: string,
  init?: { method?: string; body?: unknown },
): Promise<unknown> {
  const res = await fetch(`${RESEND_API_BASE}${path}`, {
    method: init?.method ?? "GET",
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      "Content-Type": "application/json",
    },
    body: init?.body === undefined ? undefined : JSON.stringify(init.body),
  });

  const raw = await res.text();
  let payload: unknown = null;
  if (raw) {
    try {
      payload = JSON.parse(raw);
    } catch {
      payload = raw;
    }
  }

  if (!res.ok) {
    let message = `Resend responded with HTTP ${res.status}`;
    if (payload && typeof payload === "object" && "message" in payload) {
      const m = (payload as { message?: unknown }).message;
      if (typeof m === "string" && m) message = m;
    } else if (typeof payload === "string" && payload) {
      message = payload;
    }
    throw new ResendError(res.status, message);
  }

  return payload;
}

export interface ResendDnsRecord {
  record: string | null;
  type: string;
  name: string;
  value: string;
  ttl: string | null;
  priority: number | null;
  status: string | null;
}

export interface ResendDomainStatus {
  found: boolean;
  status: string;
  records: ResendDnsRecord[];
}

/**
 * Looks the domain up in the Resend account and, when present, fetches the
 * DNS records Resend wants (each with its own verification status).
 */
export async function getDomainStatus(
  domain: string,
): Promise<ResendDomainStatus> {
  const list = (await resendFetch("/domains")) as {
    data?: Array<{ id?: unknown; name?: unknown; status?: unknown }>;
  };
  const match = (list.data ?? []).find((d) => d.name === domain);
  if (!match || typeof match.id !== "string") {
    return { found: false, status: "not_found", records: [] };
  }

  const detail = (await resendFetch(
    `/domains/${encodeURIComponent(match.id)}`,
  )) as {
    status?: unknown;
    records?: Array<Record<string, unknown>>;
  };

  const records: ResendDnsRecord[] = (detail.records ?? []).map((r) => ({
    record: typeof r.record === "string" ? r.record : null,
    type: typeof r.type === "string" ? r.type : "",
    name: typeof r.name === "string" ? r.name : "",
    value: typeof r.value === "string" ? r.value : "",
    ttl: typeof r.ttl === "string" ? r.ttl : null,
    priority: typeof r.priority === "number" ? r.priority : null,
    status: typeof r.status === "string" ? r.status : null,
  }));

  const status =
    typeof detail.status === "string"
      ? detail.status
      : typeof match.status === "string"
        ? match.status
        : "unknown";

  return { found: true, status, records };
}

export interface SendEmailInput {
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
  headers?: Record<string, string>;
}

export async function sendEmail(input: SendEmailInput): Promise<string> {
  const result = (await resendFetch("/emails", {
    method: "POST",
    body: input,
  })) as { id?: unknown };
  return typeof result.id === "string" ? result.id : "";
}
