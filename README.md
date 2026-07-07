# Parametrix

GenLayer-powered parametric weather insurance for rainfall and temperature coverage.

Parametrix lets a policyholder buy fixed-period weather coverage with clear terms: premium, coverage payout, trigger threshold, and coverage period. Settlement checks compare real weather data against the policy threshold. If the trigger is met, the payout becomes claimable.

## Overview

Parametrix is a parametric insurance application for measurable weather risk. A user chooses a location, weather risk type, event severity, and coverage duration. The app then creates a policy with fixed terms.

Instead of relying on subjective claim review, Parametrix uses rule-based settlement. Weather data is checked against the policy's stored trigger threshold, and eligible payouts are claimed by the policyholder.

## Why Parametrix

Traditional insurance can be slow, manual, and difficult to verify. Weather-risk coverage works well as a parametric product because the trigger can be defined upfront and checked against measurable data.

Parametrix explores a simpler model:

- Fixed premiums
- Fixed coverage payouts
- Transparent trigger thresholds
- Data-driven settlement
- Clear payout eligibility

The result is a more predictable coverage experience for policyholders and a cleaner technical model for builders.

## Why GenLayer

Parametrix uses GenLayer because weather-risk settlement depends on data outside the blockchain.

GenLayer Intelligent Contracts can work with external web data and support contract logic that depends on real-world inputs. Parametrix uses this to verify official threshold terms during purchase and to settle policies against weather data.

The frontend improves the user experience, but it is not the source of truth for critical policy terms. The contract verifies the selected terms before creating a policy.

### GenLayer Features Used

- `gl.nondet.web.get`: Fetches external web data from inside the Intelligent Contract. Parametrix uses it to read the official threshold registry during purchase.
- `gl.eq_principle.strict_eq`: Validates threshold registry reads through GenLayer consensus. Validators must agree on the exact official threshold registry result before the contract accepts policy terms.
- `gl.vm.run_nondet_unsafe`: Runs custom non-deterministic settlement logic with a validator function. Parametrix uses it during settlement weather checks so weather data can be fetched and validated before policy state is updated.
- `gl.message.sender_address`: Identifies the wallet calling the contract. Parametrix uses it to assign policy ownership, restrict policyholder actions, and protect operator-only functions.
- `gl.message.value`: Reads the GEN sent with payable transactions. Parametrix uses it to verify that the correct premium or pool funding amount was paid.
- `@gl.public.write.payable`: Marks functions that can receive GEN. Parametrix uses it for purchasing coverage and adding funds to the underwriting pool.
- `gl.public.write`: Exposes state-changing contract methods such as cancelling coverage, settling a policy day, claiming payouts, and withdrawing pool funds.
- `gl.public.view`: Exposes read-only methods used by the frontend, such as reading policies, pool status, settlement history, and settlement readiness.
- `emit_transfer`: Sends GEN from the contract. Parametrix uses it for policy payouts and pool withdrawals.

## How Parametrix Works

1. Choose coverage: select location, coverage type, event level, and duration.
2. Pay a fixed premium: the premium and coverage payout are known upfront.
3. Policy is created: the contract stores verified policy terms and reserves the payout amount.
4. Weather is checked: settlement compares weather data against the stored threshold.
5. Eligible payout becomes claimable: the policyholder manually claims the payout if the trigger is met.

## Coverage Options

Supported locations:

- Lagos, Nigeria
- Abuja, Nigeria
- Kano, Nigeria
- New York, United States
- Los Angeles, United States
- Miami, United States
- London, United Kingdom
- Manchester, United Kingdom
- Birmingham, United Kingdom

Coverage types:

- Rainfall Coverage
- Temperature Coverage

Event levels:

- Severe Event
- Extreme Event
- Critical Event

Durations:

- 7 days
- 14 days
- 30 days

Premium and payout:

| Event level | Premium | Coverage payout |
| --- | ---: | ---: |
| Severe | 1 GEN | 3 GEN |
| Extreme | 2 GEN | 6 GEN |
| Critical | 3 GEN | 10 GEN |

## Threshold Registry and Trust Model

Parametrix does not rely on the frontend as the source of truth for thresholds.

The frontend displays threshold values so users can review coverage terms before purchase. During purchase, the GenLayer contract fetches the official threshold registry and verifies the selected location, policy type, event level, threshold value, weather variable, and unit.

Official registry:

```text
https://parametrix-thresholds.netlify.app/thresholds/v1.json
```

This means a modified frontend cannot silently change a user's threshold or payout terms without contract verification. Once a policy is created, settlement uses the threshold stored in that policy.

The repository also includes a local copy at `public/thresholds/v1.json`.

## Smart Contract Architecture

The core contract is `contracts/Parametrix.py`, implemented as the `Parametrix` contract class.

The contract is responsible for:

- Storing policies and policy ownership
- Accepting premiums and pool funds
- Tracking the capital pool, reserved payouts, and available capacity
- Verifying threshold registry terms during purchase
- Creating policies with fixed premium and payout terms
- Settling policy days against weather data
- Recording settlement history
- Updating policy status
- Sending payouts when a policyholder claims

Key read methods:

- `get_policy(policy_id)`
- `get_my_policies()`
- `get_policies_by_owner(owner)`
- `get_active_policies()`
- `get_pool_status()`
- `get_owner()`
- `get_last_policy_id()`
- `get_policy_owner(policy_id)`
- `get_policy_summary(policy_id)`
- `get_policy_settlement_status(policy_id)`
- `get_policy_settlement_history(policy_id)`
- `get_policy_financials(policy_id)`
- `get_settlement_readiness(policy_id, settlement_date)`

Key write methods:

- `purchase_policy(location_id, policy_type, event_level, duration_days)`
- `add_pool_funds()`
- `withdraw_from_pool(amount_gen)`
- `cancel_policy(policy_id)`
- `settle_policy_day(policy_id, settlement_date)`
- `claim_payout(policy_id)`

## Policy Lifecycle

| Contract status | User-facing status | Meaning |
| --- | --- | --- |
| `ACTIVE` | Coverage Active | The policy is active and can be settled. |
| `TRIGGERED` | Payout Available | The weather trigger was met and payout can be claimed. |
| `PAID` | Payout Paid | The policyholder claimed the payout. |
| `EXPIRED` | Coverage Ended | The coverage period ended without a trigger. |
| `CANCELLED` | Cancelled | The active policy was cancelled by the policyholder. |

Each policy can have one payout for the coverage period in the current MVP.

## Daily Settlement Automation

The settlement worker lives in `/cron` and runs as a Cloudflare Worker cron.

Schedule:

```text
Daily at 01:00 UTC
```

The worker:

- Reads active policies from the deployed GenLayer contract
- Checks `get_settlement_readiness(policy_id, settlement_date)`
- Calls `settle_policy_day(policy_id, settlement_date)` for ready policies
- Verifies state after settlement
- Processes up to the configured max policies per run
- Does not claim payouts for users

If a policy becomes triggered, the policyholder still claims the payout manually.

The cron worker is separate from the frontend. The frontend is for user and operator UI; the worker is for scheduled settlement operations.

## Frontend Application

The frontend lives in `/frontend` and is built with:

- Next.js
- TypeScript
- Tailwind CSS
- Reown AppKit
- Wagmi
- Viem
- GenLayerJS
- TanStack Query

Main user flows:

- Landing page
- App home
- Buy Coverage checkout
- My Policies dashboard
- Policy detail page
- Settlement history
- Claim Payout when eligible

Admin/operator flows:

- Settlement Operations page
- Pool overview
- Active coverage monitoring
- Cron health status
- Readiness checks
- Manual settlement
- Pool funding and withdrawal controls

Normal users see My Policies, Buy Coverage, and Home. The Settlement Operations route is shown only to the contract owner wallet in the frontend.

## Technical Pillars and Key Innovations

- Parametric insurance logic on a GenLayer Intelligent Contract
- Contract-verified threshold registry terms
- Frontend-independent validation of critical policy terms
- Weather-data-driven settlement using Open-Meteo data
- Fixed premium and fixed coverage payout model
- Wallet-based policy ownership
- Manual payout claim after trigger
- Daily settlement automation through Cloudflare Workers
- Separated user app and operator console
- Rate-limit-aware frontend reads
- Clear policy lifecycle and settlement history

## Repository Structure

```text
parametrix/
├── contracts/
│   └── Parametrix.py
├── frontend/
│   ├── public/
│   └── src/
├── cron/
│   ├── src/
│   └── wrangler.toml
├── public/
│   └── thresholds/
│       └── v1.json
├── scripts/
├── tests/
├── workers/
└── README.md
```

## Local Development

Prerequisites:

- Node.js
- npm
- Git
- GenLayer Bradbury testnet wallet setup
- Reown project ID

Clone the repository:

```bash
git clone https://github.com/jason4185/parametrix.git
cd parametrix
```

Run the frontend:

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Open:

```text
http://localhost:3000
```

Required public frontend configuration:

```bash
NEXT_PUBLIC_REOWN_PROJECT_ID=
NEXT_PUBLIC_PARAMETRIX_CONTRACT_ADDRESS=
NEXT_PUBLIC_GENLAYER_NETWORK=
NEXT_PUBLIC_GENLAYER_RPC_URL=
NEXT_PUBLIC_GENLAYER_CHAIN_RPC_URL=
NEXT_PUBLIC_GENLAYER_CHAIN_ID=
NEXT_PUBLIC_GENLAYER_CURRENCY_SYMBOL=
NEXT_PUBLIC_GENLAYER_EXPLORER_URL=
NEXT_PUBLIC_GENLAYER_CHAIN_EXPLORER_URL=
```

These are public frontend config values. Do not put private keys, cron secrets, or operator credentials in frontend environment files.

## Running the Settlement Worker

The settlement worker lives in `/cron`.

```bash
cd cron
npm install
cp .dev.vars.example .dev.vars
npm run typecheck
npm run build
```

Deploy to Cloudflare Workers:

```bash
npx wrangler deploy
```

Secrets such as `OPERATOR_PRIVATE_KEY` and `CRON_SECRET` must be stored as Cloudflare Worker secrets or local development variables, not committed to GitHub.

The worker also supports a protected `POST /run` endpoint for authorized manual runs. The public frontend only reads the public `/health` endpoint.

## Deployment

Frontend:

- Platform: Vercel
- Root Directory: `frontend`
- Framework: Next.js
- Public frontend environment variables are configured in Vercel

Cron:

- Platform: Cloudflare Workers
- Schedule: daily at 01:00 UTC
- Secrets are managed with Wrangler or the Cloudflare dashboard

Contract:

- Network: GenLayer Bradbury testnet
- Contract address is configured through frontend and cron environment variables

## Security and Status Notes

Parametrix is a production-quality technical MVP currently deployed on GenLayer Bradbury testnet. It demonstrates how parametric weather coverage can be created, settled, and paid out using contract-verified policy terms and real weather data.

Parametrix is also a serious parametric insurance infrastructure experiment and technical prototype for weather-risk products that depend on external data, fixed policy terms, settlement automation, and wallet-based payout flows.

Parametrix is not currently offered as a regulated insurance product. Before any real-money public launch, it would require the appropriate legal, actuarial, compliance, and security review.

Important security notes:

- Never commit `.env`, `.env.local`, `.dev.vars`, private keys, API tokens, or secrets.
- The frontend is not trusted for critical policy terms.
- Private keys and cron secrets must stay outside GitHub.
- Pool withdrawal is owner-restricted in the contract.
- Payouts are manually claimed by policyholders.
- Settlement currently relies on a configured operator/cron worker.
- Cron processes one configured settlement date per run; missed-date catch-up is not implemented as a full backfill system.

## Roadmap

- More locations
- More weather risk types
- Improved settlement batching
- Missed-date catch-up
- Better policy analytics
- Production risk modeling
- Security review
- More robust underwriting pool management

## License

License: Not specified yet.
