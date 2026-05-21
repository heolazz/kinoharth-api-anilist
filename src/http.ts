type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type ApiRequest = {
  method?: string;
  url?: string;
  headers: Record<string, string | string[] | undefined>;
};

export type ApiResponse = {
  status(code: number): ApiResponse;
  setHeader(name: string, value: string): void;
  json(body: unknown): void;
  end(body?: string): void;
};

const DEFAULT_ALLOWED_ORIGINS = [
  "https://kinoharth.online",
  "https://www.kinoharth.online",
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:5174",
];

function getHeader(req: ApiRequest, name: string) {
  const value = req.headers[name] || req.headers[name.toLowerCase()];

  return Array.isArray(value) ? value[0] : value;
}

function getAllowedOrigins() {
  return (process.env.ALLOWED_ORIGINS || DEFAULT_ALLOWED_ORIGINS.join(","))
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function applyCors(req: ApiRequest, res: ApiResponse) {
  const origin = getHeader(req, "origin");
  const requestedHeaders = getHeader(req, "access-control-request-headers");
  const allowedOrigins = getAllowedOrigins();
  const allowedOrigin =
    origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0] || "*";

  res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    requestedHeaders || "Content-Type, X-KinoHarth-Key"
  );
  res.setHeader("Vary", "Origin, Access-Control-Request-Headers");
}

export function assertApiKey(req: ApiRequest) {
  const expectedKey = process.env.KINOHARTH_API_KEY;

  if (!expectedKey) {
    return;
  }

  const receivedKey = getHeader(req, "x-kinoharth-key");

  if (receivedKey !== expectedKey) {
    throw Object.assign(new Error("Unauthorized"), { statusCode: 401 });
  }
}

export function json(
  res: ApiResponse,
  body: unknown,
  statusCode = 200,
  maxAge = 300
) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader(
    "Cache-Control",
    `public, max-age=${maxAge}, s-maxage=${maxAge}, stale-while-revalidate=${Math.max(
      maxAge * 6,
      60
    )}`
  );
  res.status(statusCode).json(body);
}

export function errorJson(res: ApiResponse, error: unknown) {
  const statusCode =
    typeof error === "object" &&
    error !== null &&
    "statusCode" in error &&
    typeof error.statusCode === "number"
      ? error.statusCode
      : 500;
  const message = error instanceof Error ? error.message : "Internal Server Error";

  json(res, { error: message } as Record<string, JsonValue>, statusCode, 60);
}

export function readUrl(req: ApiRequest) {
  return new URL(req.url || "/", "https://kinoharth-api.local");
}

export function readInteger(
  url: URL,
  name: string,
  fallback: number,
  min = 1,
  max = 50
) {
  const value = Number(url.searchParams.get(name) || fallback);

  if (!Number.isInteger(value)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, value));
}
