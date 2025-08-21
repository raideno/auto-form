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

type TextareaMetadata = CommonMetadata & {
  type: "textarea";
  resize?: boolean;
};

type SelectMetadata = CommonMetadata & {
  type: "select";
};

type RadioMetadata = CommonMetadata & {
  type: "radio";
};

type ForbidFileProps<T> = T & {
  resize?: never;
};

type NonFileMetadata = ForbidFileProps<
  CommonMetadata & {
    type?: Exclude<string, "textarea" | "select" | "radio">;
  }
>;

export type FieldMetadata =
  | TextareaMetadata
  | SelectMetadata
  | RadioMetadata
  | NonFileMetadata;

// NOTE: metadata only applicable to string or number fields
// https://zod.dev/metadata?id=referencing-inferred-types
export const MetadataRegistry = z.registry<FieldMetadata, z.ZodTypeAny>();
