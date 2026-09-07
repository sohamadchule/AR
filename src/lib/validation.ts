import { z } from "zod";

/**
 * Zod schemas for API inputs. Types are derived from the schemas (z.infer) so
 * validation and TypeScript types cannot drift apart.
 */

export const productCreateSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  description: z.string().trim().max(5000).optional().default(""),
});

export const productUpdateSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(200).optional(),
    description: z.string().trim().max(5000).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export type ProductCreateInput = z.infer<typeof productCreateSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;
