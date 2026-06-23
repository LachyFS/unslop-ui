import { z } from "zod";

export const severitySchema = z.enum(["off", "warn", "error"]);

export const configSchema = z
  .object({
    include: z.array(z.string()).optional(),
    ignore: z.array(z.string()).optional(),
    stack: z
      .object({
        react: z.boolean().optional(),
        tailwind: z.boolean().optional(),
        shadcn: z.boolean().optional(),
      })
      .optional(),
    rules: z.record(z.string(), severitySchema).optional(),
  })
  .strict();
