/** Shared response helpers for Edge Functions (CONVENTIONS.md envelope). */

export type FieldError = { field: string; message: string };

// CORS - Browser calls from the frontend
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

// Typed Error - Status, code, optional field details
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: FieldError[],
  ) {
    super(message);
    this.name = "HttpError";
  }
}

// Success Envelope
export function ok(data: unknown, status = 200): Response {
  return Response.json(
    { success: true, data, meta: { timestamp: new Date().toISOString() } },
    { status, headers: corsHeaders },
  );
}

// Error Envelope - Unknown errors become a generic 500
export function fail(error: unknown): Response {
  if (error instanceof HttpError) {
    return Response.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          ...(error.details?.length ? { details: error.details } : {}),
        },
      },
      { status: error.status, headers: corsHeaders },
    );
  }
  console.error(error);
  return Response.json(
    {
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Internal server error",
      },
    },
    { status: 500, headers: corsHeaders },
  );
}
