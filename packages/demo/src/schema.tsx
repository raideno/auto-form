import { PriceController } from "@raideno/auto-form/controllers";
import { z_ } from "@raideno/auto-form/zod";
import { MetadataRegistry } from "@raideno/auto-form/registry";

export const INITIAL_SCHEMA_CODE = z_.object({
  name: z_.string().max(32).min(2),
  avatar: z_.file().register(MetadataRegistry, {
    description: "Upload your **__avatar__**.",
  }),
  tags: z_.array(z_.string()).max(8),
  price: z_
    .number()
    .min(1)
    .register(MetadataRegistry, {
      withControls: true,
      step: 10,
      placeholder: "100",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      controller: PriceController,
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
  properties: z_.object({
    firstname: z_.string().register(MetadataRegistry, { label: "Firstname" }),
    lastname: z_.string().register(MetadataRegistry, { label: "Lastname" })
  }),
  contacts: z_.array(
    z_.object({
      name: z_.string().register(MetadataRegistry, { label: "Name" }),
      email: z_.string().email().register(MetadataRegistry, { label: "Email" }),
    })
  ).max(3)
});
