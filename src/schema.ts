import { z_ } from "@/components/auto-form";
import { MetadataRegistry } from "@/components/auto-form/registry";

export const INITIAL_SCHEMA_CODE = z_.object({
  name: z_.string().max(32).min(2),
  images: z_
    .array(
      z_
        .file()
        .mime(["image/jpeg", "image/png"])
        .min(1)
        .max(4 * 1024 * 1024)
    )
    .min(2)
    .max(4),
  tags: z_.array(z_.string()).max(8),
  description: z_
    .string()
    .register(MetadataRegistry, { type: "textarea", resize: true }),
  theme: z_
    .enum(["light", "dark"])
    .register(MetadataRegistry, { type: "radio", label: "Theme Preference" }),
});

export const INITIAL_SCHEMA_STRING = `
z_.object({
  name: z_.string().max(32).min(2),
  images: z_
    .array(
      z_
        .file()
        .mime(["image/jpeg", "image/png"])
        .min(1)
        .max(4 * 1024 * 1024)
    )
    .min(2)
    .max(4),
  tags: z_.array(z_.string()).max(8),
  description: z_
    .string()
    .register(MetadataRegistry, { type: "textarea", resize: true }),
  theme: z_
    .enum(["light", "dark"])
    .register(MetadataRegistry, { type: "radio", label: "Theme Preference" }),
});
`.trim();
