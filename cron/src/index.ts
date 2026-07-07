import { isValidDateString } from "./date";
import { logger } from "./logger";
import { runSettlementCron } from "./settlement";
import type { Env, SettlementCronOptions } from "./types";

const healthCorsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...init.headers
    }
  });
}

function healthJsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...healthCorsHeaders
    }
  });
}

function unauthorized() {
  return jsonResponse({ ok: false, error: "Unauthorized" }, { status: 401 });
}

function isAuthorized(request: Request, env: Env) {
  if (!env.CRON_SECRET) {
    return false;
  }

  return request.headers.get("authorization") === `Bearer ${env.CRON_SECRET}`;
}

async function parseManualRunOptions(request: Request): Promise<SettlementCronOptions> {
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return { source: "manual" };
  }

  const body = (await request.json().catch(() => ({}))) as {
    dry_run?: unknown;
    settlement_date?: unknown;
  };
  const options: SettlementCronOptions = {
    source: "manual"
  };

  if (typeof body.settlement_date === "string") {
    if (!isValidDateString(body.settlement_date)) {
      throw new Error("Invalid settlement_date. Use YYYY-MM-DD.");
    }

    options.settlementDate = body.settlement_date;
  }

  if (typeof body.dry_run === "boolean") {
    options.dryRun = body.dry_run;
  }

  return options;
}

export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(
      runSettlementCron(env, { source: "cron" }).catch((error) => {
        logger.error("cron_failed", { error });
      })
    );
  },

  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS" && url.pathname === "/health") {
      return new Response(null, {
        status: 204,
        headers: healthCorsHeaders
      });
    }

    if (request.method === "GET" && url.pathname === "/health") {
      return healthJsonResponse({
        ok: true,
        service: "parametrix-settlement-cron"
      });
    }

    if (request.method === "POST" && url.pathname === "/run") {
      if (!isAuthorized(request, env)) {
        return unauthorized();
      }

      try {
        const options = await parseManualRunOptions(request);
        const summary = await runSettlementCron(env, options);
        return jsonResponse(summary);
      } catch (error) {
        return jsonResponse(
          {
            error: error instanceof Error ? error.message : "Manual run failed.",
            ok: false
          },
          { status: 400 }
        );
      }
    }

    return jsonResponse({ ok: false, error: "Not found" }, { status: 404 });
  }
};
