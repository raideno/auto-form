import { z_ } from "../src/components/auto-form/enhanced-zod";
import { MetadataRegistry } from "../src/components/auto-form/registry";

export const INITIAL_SCHEMA_CODE = z_.object({
  name: z_.string().max(32).min(2),
  avatar: z_.file(),
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
  price: z_.number().min(1).max(100).register(MetadataRegistry, {
    withControls: true,
    step: 10,
  }),
  priority: z_.enum(["low", "medium", "high"]).register(MetadataRegistry, {
    type: "radio",
    label: "Priority Level",
    description: "Select the priority using custom buttons",
  }),

  rating: z_
    .number()
    .min(1)
    .max(5)
    .register(MetadataRegistry, {
      label: "Rating",
      description: "Rate this item from 1 to 5 stars",
      controller: ({ field, formState, defaultController }) => {
        // Can access all field configuration and state
        const currentRating = (field.value as number) || 0;

        // Fallback to default controller if needed
        if (formState.isLoading) {
          return defaultController as React.ReactNode;
        }

        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "4px",
              }}
            >
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => field.onChange(star)}
                  onBlur={field.onBlur}
                  disabled={formState.isSubmitting}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "24px",
                    cursor: formState.isSubmitting ? "not-allowed" : "pointer",
                    color: currentRating >= star ? "#fbbf24" : "#d1d5db",
                    transition: "color 0.2s",
                  }}
                  title={`${star} star${star > 1 ? "s" : ""}`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
        );
      },
    }),

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
