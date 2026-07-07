export const homepageContent = {
  headline: "Parametric weather insurance, settled by real weather data.",
  subtext:
    "Buy fixed-period rainfall or temperature coverage. Parametrix uses GenLayer to verify policy terms, check official weather data, and trigger payouts when your selected threshold is met.",
  howItWorksTitle: "How Parametrix protects policyholders",
  howItWorksSubtitle:
    "Fixed premiums, clear coverage payouts, and settlement updates designed for measurable weather risk.",
  coverageTitle: "Rainfall and temperature coverage",
  coverageSubtitle:
    "Choose a location, coverage type, trigger level, and duration before you buy.",
  finalCtaTitle: "Built for fixed-period weather risk",
  finalCtaBody:
    "Prepare policy terms, review coverage, and claim eligible payouts.",
};

export const howItWorksContent = {
  intro:
    "Parametrix provides fixed-period weather-risk coverage where payouts are based on objective weather thresholds, not manual claim review.",
  steps: [
    {
      title: "Choose policy terms",
      body: "Select location, coverage type, event level, and coverage duration.",
    },
    {
      title: "Pay the premium",
      body: "The premium and coverage payout are fixed by the selected event level before purchase.",
    },
    {
      title: "Weather is checked daily",
      body: "Settlement checks compare official Open-Meteo weather data against the stored threshold.",
    },
    {
      title: "Trigger is recorded",
      body: "If the threshold is met, the policy moves into payout available status.",
    },
    {
      title: "Policyholder claims payout",
      body: "The eligible policyholder can claim the payout once the policy is triggered.",
    },
  ],
  settlement:
    "Daily automated settlement uses active coverage data to review each covered day.",
};

export const coverageTypeContent = [
  {
    id: "RAINFALL_INDEX",
    title: "Rainfall Index Policy",
    description:
      "Protects policyholders when measured rainfall crosses severe, extreme, or critical trigger thresholds during the coverage period.",
  },
  {
    id: "TEMPERATURE_INDEX",
    title: "Temperature Index Policy",
    description:
      "Protects policyholders when measured temperature conditions meet the selected threshold level during the coverage period.",
  },
] as const;

export const dashboardContent = {
  description:
    "Manage your active coverage, settlement updates, and eligible payouts.",
  emptyState:
    "Connect your wallet to load your Parametrix policies and payout details.",
};

export const buyPageContent = {
  description:
    "Choose a location, coverage type, trigger level, and coverage period.",
  helper:
    "Premium and coverage payout are fixed before purchase.",
};

export const adminPageContent = {
  description:
    "Monitor automated settlement, pool capacity, and active coverage.",
  settlement:
    "Settlement automation reviews active policy data and settles the next unsettled covered day for each active policy.",
};

export const policyDetailsContent = {
  description:
    "Review your coverage terms, settlement status, and payout details.",
  chart:
    "Settlement history shows daily weather values compared with the selected threshold.",
};
