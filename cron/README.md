# Parametrix Settlement Cron

Cloudflare Worker Cron Trigger for automated Parametrix settlement checks.

## What This Worker Does

This worker runs the Parametrix daily settlement operator. It reads active policy IDs from the Parametrix GenLayer contract, checks whether each policy is ready to settle for a target weather date, and submits `settle_policy_day(policy_id, settlement_date)` only when the contract reports the policy is ready.

The worker does not store user policy data. The contract remains the source of truth.

## Schedule

The cron runs every day at `01:00 UTC`:

```toml
[triggers]
crons = ["0 1 * * *"]
```

It settles yesterday's UTC weather date by default. For example, a run at `2026-07-06 01:00 UTC` settles `2026-07-05`.

## Required Environment Variables

Set these variables in Cloudflare:

```txt
PARAMETRIX_CONTRACT_ADDRESS=0x...
GENLAYER_RPC_URL=https://rpc-bradbury.genlayer.com
GENLAYER_NETWORK=testnetBradbury
MAX_POLICIES_PER_RUN=25
SETTLEMENT_DAYS_AGO=1
DRY_RUN=false
CRON_SECRET=replace-with-long-random-secret
```

Defaults used by the code:

- `MAX_POLICIES_PER_RUN=25`
- `SETTLEMENT_DAYS_AGO=1`
- `DRY_RUN=false`

## Required Secret

The operator private key must be set as a Cloudflare secret:

```bash
npx wrangler secret put OPERATOR_PRIVATE_KEY
```

The operator wallet must have enough GEN for settlement transaction fees.

Do not commit a real private key.

## Local Development

Create local variables from the example:

```bash
cp .dev.vars.example .dev.vars
```

Then edit `.dev.vars` with test values.

Install dependencies:

```bash
npm install
```

Run the Worker locally:

```bash
npx wrangler dev
```

## Deploy

```bash
npm install
npx wrangler secret put OPERATOR_PRIVATE_KEY
npx wrangler deploy
```

## Manual Protected Run

`POST /run` is protected by `CRON_SECRET`.

```bash
curl -X POST https://<worker-url>/run \
  -H "Authorization: Bearer <CRON_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"settlement_date":"2026-07-05","dry_run":true}'
```

## Dry Run

Use `dry_run=true` to check readiness without submitting settlement transactions:

```bash
curl -X POST https://<worker-url>/run \
  -H "Authorization: Bearer <CRON_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"dry_run":true}'
```

You can also set:

```txt
DRY_RUN=true
```

in local development.

## Health Check

```bash
curl https://<worker-url>/health
```

Returns:

```json
{ "ok": true, "service": "parametrix-settlement-cron" }
```

## Rate Limit Troubleshooting

The worker avoids GenLayer RPC spam by:

- Processing policies sequentially.
- Delaying 500ms between policy checks.
- Calling `get_policy(policy_id)` only after a settlement write, for verification.
- Retrying rate-limit or `gen_call` errors once after a 5 second wait.
- Retrying post-write verification at most 5 times with 1.5 seconds between attempts.
- Limiting each run with `MAX_POLICIES_PER_RUN`.

If rate limits still occur, reduce `MAX_POLICIES_PER_RUN` or run a manual dry run first to inspect readiness volume.

## Important Safety Notes

- The worker only submits `settle_policy_day(policy_id, settlement_date)`.
- It does not auto-claim payouts.
- Users claim payouts themselves from the Parametrix app.
- It does not send thresholds, weather values, payout values, premiums, coverage start dates, or coverage end dates.
- It does not add KV, D1, R2, Durable Objects, or any user database storage.
- It does not persist user policy data.
