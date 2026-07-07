type LogLevel = "error" | "info" | "warn";

type LogFields = Record<string, unknown>;

function sanitize(value: unknown): unknown {
  if (value instanceof Error) {
    return {
      message: value.message,
      name: value.name
    };
  }

  return value;
}

function log(level: LogLevel, event: string, fields: LogFields = {}) {
  const payload: LogFields = {
    event,
    level,
    timestamp: new Date().toISOString()
  };

  for (const [key, value] of Object.entries(fields)) {
    if (key.toLowerCase().includes("private") || key.toLowerCase().includes("secret")) {
      continue;
    }

    payload[key] = sanitize(value);
  }

  console.log(JSON.stringify(payload));
}

export const logger = {
  error: (event: string, fields?: LogFields) => log("error", event, fields),
  info: (event: string, fields?: LogFields) => log("info", event, fields),
  warn: (event: string, fields?: LogFields) => log("warn", event, fields)
};
