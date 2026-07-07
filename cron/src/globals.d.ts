type ScheduledEvent = {
  cron: string;
  scheduledTime: number;
  type: "scheduled";
};

type ExecutionContext = {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException?(): void;
};

type EthereumProvider = {
  request(args: { method: string; params?: unknown[] | object }): Promise<unknown>;
};
