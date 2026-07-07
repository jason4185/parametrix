export function isRateLimitError(error: unknown) {
  const message =
    error instanceof Error ? error.message.toLowerCase() : String(error ?? "");

  return message.includes("rate limit") || message.includes("gen_call");
}

export function readableReadErrorTitle(error: unknown) {
  return isRateLimitError(error) ? "Network is busy" : "Unable to load data";
}

export function readableReadErrorMessage(error: unknown) {
  if (isRateLimitError(error)) {
    return "Parametrix is having trouble loading policy data. Please wait a moment and try again.";
  }

  return "Parametrix could not load the latest policy data. Please try again.";
}
