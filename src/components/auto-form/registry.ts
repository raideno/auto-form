// registry.tsx

import { z } from "zod/v4";

// NOTE: moved into here in order to keep @ imports in auto.tsx and still be
// able to import registry at build time as @ imports aren't resolved yet

type Values = Record<string, unknown>;

type CommonMetadata = {
  disabled?: boolean | ((values: Values) => boolean);
  hidden?: boolean | ((values: Values) => boolean);
  readonly?: boolean | ((values: Values) => boolean);
  placeholder?: string;
  description?: string;
  label?: string;
  halfWidth?: boolean;
};

// Only allow file-related props when type is "file" or "files"
type TextareaMetadata = CommonMetadata & {
  type: "textarea";
  resize?: boolean;
};

// Forbid file-related props for all other types (or when type is omitted)
type ForbidFileProps<T> = T & {
  resize?: never;
};

// If you want to restrict to a known set of types, replace `string` below
// with a specific union (e.g., "text" | "textarea" | "switch" | ...).
type NonFileMetadata = ForbidFileProps<
  CommonMetadata & {
    type?: Exclude<string, "textarea">;
  }
>;

export type FieldMetadata = TextareaMetadata | NonFileMetadata;

// NOTE: metadata only applicable to string or number fields
// https://zod.dev/metadata?id=referencing-inferred-types
export const MetadataRegistry = z.registry<FieldMetadata, z.ZodTypeAny>();
