import { PriceController } from "../src/components/controllers/price";
import { z_ } from "../src/components/auto-form/enhanced-zod";
import { MetadataRegistry } from "../src/components/auto-form/registry";

export const INITIAL_SCHEMA_CODE = z_.object({
  name: z_.string().max(32).min(2),
  avatar: z_.file(),
  tags: z_.array(z_.string()).max(8),
  price: z_
    .number()
    .min(1)
    .register(MetadataRegistry, {
      withControls: true,
      step: 10,
      placeholder: "100",
      controller: PriceController as any,
    }),
  description: z_
    .string()
    .optional()
    .nullable()
    .register(MetadataRegistry, { type: "textarea", resize: true }),
  theme: z_
    .enum(["light", "dark"])
    .optional()
    .nullable()
    .register(MetadataRegistry, { type: "radio", label: "Theme Preference" }),
});

export const INITIAL_SCHEMA_STRING = `
z_.object({
  name: z_.string().max(32).min(2),
  avatar: z_.file(),
  tags: z_.array(z_.string()).max(8),
  price: z_
    .number()
    .min(1)
    .register(MetadataRegistry, {
      withControls: true,
      step: 10,
      placeholder: "100",
      controller: PriceController as any,
    }),
  description: z_
    .string()
    .optional()
    .nullable()
    .register(MetadataRegistry, { type: "textarea", resize: true }),
  theme: z_
    .enum(["light", "dark"])
    .optional()
    .nullable()
    .register(MetadataRegistry, { type: "radio", label: "Theme Preference" }),
});
`.trim();
