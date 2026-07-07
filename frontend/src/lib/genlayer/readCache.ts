type CacheEntry = {
  expiresAt: number;
  value: unknown;
};

const DEFAULT_CACHE_TTL_MS = 120_000;
const MAX_CONCURRENT_READS = 2;
const MIN_READ_START_DELAY_MS = 250;

const responseCache = new Map<string, CacheEntry>();
const inFlightReads = new Map<string, Promise<unknown>>();
const queuedReads: Array<() => void> = [];

let activeReads = 0;
let lastReadStartedAt = 0;

function isDevelopment() {
  return process.env.NODE_ENV === "development";
}

function logRead(message: string, details: Record<string, unknown>) {
  if (!isDevelopment()) {
    return;
  }

  console.info(`[Parametrix read] ${message}`, details);
}

function dequeueRead() {
  if (activeReads >= MAX_CONCURRENT_READS) {
    return;
  }

  const next = queuedReads.shift();

  if (!next) {
    return;
  }

  activeReads += 1;

  const elapsed = Date.now() - lastReadStartedAt;
  const delay = Math.max(0, MIN_READ_START_DELAY_MS - elapsed);

  setTimeout(() => {
    lastReadStartedAt = Date.now();
    next();
  }, delay);
}

function enqueueRead<T>(key: string, task: () => Promise<T>) {
  return new Promise<T>((resolve, reject) => {
    queuedReads.push(() => {
      logRead("throttled start", { key });

      task()
        .then(resolve)
        .catch(reject)
        .finally(() => {
          activeReads = Math.max(0, activeReads - 1);
          dequeueRead();
        });
    });

    dequeueRead();
  });
}

export function createReadCacheKey({
  account,
  args,
  contractAddress,
  methodName,
}: {
  account?: string;
  args: unknown[];
  contractAddress: string;
  methodName: string;
}) {
  return `${contractAddress}:${account ?? "read"}:${methodName}:${JSON.stringify(args)}`;
}

export async function cachedGenLayerRead<T>({
  cacheTtlMs = DEFAULT_CACHE_TTL_MS,
  forceFresh,
  forceRefresh = false,
  key,
  task,
}: {
  cacheTtlMs?: number;
  forceFresh?: boolean;
  forceRefresh?: boolean;
  key: string;
  task: () => Promise<T>;
}) {
  const shouldForceRefresh = forceFresh ?? forceRefresh;
  const cached = responseCache.get(key);

  if (!shouldForceRefresh && cached && cached.expiresAt > Date.now()) {
    logRead("cache hit", { key });
    return cached.value as T;
  }

  const inFlight = inFlightReads.get(key);

  if (!shouldForceRefresh && inFlight) {
    logRead("in-flight dedupe hit", { key });
    return inFlight as Promise<T>;
  }

  logRead(
    shouldForceRefresh ? "force-fresh read" : cached ? "cache miss expired" : "cache miss",
    { key },
  );

  const promise = enqueueRead(key, task).then((value) => {
    responseCache.set(key, {
      expiresAt: Date.now() + cacheTtlMs,
      value,
    });

    return value;
  });

  inFlightReads.set(key, promise);

  try {
    return await promise;
  } finally {
    inFlightReads.delete(key);
  }
}

export function clearGenLayerReadCache(predicate?: (key: string) => boolean) {
  if (!predicate) {
    responseCache.clear();
    inFlightReads.clear();
    return;
  }

  for (const key of Array.from(responseCache.keys())) {
    if (predicate(key)) {
      responseCache.delete(key);
    }
  }

  for (const key of Array.from(inFlightReads.keys())) {
    if (predicate(key)) {
      inFlightReads.delete(key);
    }
  }
}

export function clearGenLayerMethodCache(methodName: string) {
  clearGenLayerReadCache((key) => key.includes(`:${methodName}:`));
}
