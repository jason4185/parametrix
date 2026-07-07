import { z } from "zod";

export const policyFormSchema = z.object({
  locationId: z.string().min(1, "Choose a coverage location."),
  policyType: z.enum(["RAINFALL_INDEX", "TEMPERATURE_INDEX"]),
  eventLevel: z.enum(["SEVERE_EVENT", "EXTREME_EVENT", "CRITICAL_EVENT"]),
  durationDays: z.union([z.literal(7), z.literal(14), z.literal(30)], {
    error: "Choose a supported duration.",
  }),
});

export type PolicyFormValues = z.infer<typeof policyFormSchema>;
