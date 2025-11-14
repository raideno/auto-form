// registry.tsx

import { z } from "zod/v4";
import type React from "react";
import type { Control, FieldPath, FieldValues } from "react-hook-form";
// import type { EnumOption } from "./enhanced-zod";
import type { AutoFormContextValue, FieldConfig } from "./context";

// NOTE: moved into here in order to keep @ imports in auto.tsx and still be
// able to import registry at build time as @ imports aren't resolved yet

export type Values = Record<string, unknown>;

export type RenderParams<
  TFieldValues extends FieldValues = FieldValues,
  Type = unknown
> = {
  fieldConfig: FieldConfig;
  meta: FieldMetadata | undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  context: AutoFormContextValue<any>;
  field: {
    name: FieldPath<TFieldValues>;
    value: Type;
    onChange: (value: Type) => void;
    onBlur: () => void;
  };
  fieldState: {
    invalid: boolean;
    error?: { message?: string };
  };
  formState: {
    isSubmitting: boolean;
    isLoading: boolean;
  };
  labels: boolean;
  controller: React.ReactNode;
  defaultRender: () => React.ReactNode;
  ui: {
    disabled: boolean;
    readOnly: boolean;
  };
};

export type ControllerParams<
  TFieldValues extends FieldValues = FieldValues,
  Type = unknown
> = {
  fieldConfig: FieldConfig;
  meta: FieldMetadata | undefined;
  name: FieldPath<TFieldValues>;
  control: Control<TFieldValues>;
  defaultValue?: Type;
  rules?: object;
  labels: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  context: AutoFormContextValue<any>;
  field: {
    name: FieldPath<TFieldValues>;
    value: Type;
    onChange: (value: Type) => void;
    onBlur: () => void;
  };
  fieldState: {
    invalid: boolean;
    error?: { message?: string };
  };
  formState: {
    isSubmitting: boolean;
    isLoading: boolean;
  };
  ui: {
    disabled: boolean;
    readOnly: boolean;
  };
  // Default controller component for fallback
  defaultController: React.ReactNode;
};

export type CommonMetadata = {
  disabled?: boolean | ((values: Values) => boolean);
  hidden?: boolean | ((values: Values) => boolean);
  readonly?: boolean | ((values: Values) => boolean);
  placeholder?: string;
  description?: string;
  label?: string;
  withControls?: boolean;
  step?: number;
  halfWidth?: boolean;
  renderer?: <TFieldValues extends FieldValues = FieldValues>(
    params: RenderParams<TFieldValues>
  ) => React.ReactNode;
  controller?: <TFieldValues extends FieldValues = FieldValues>(
    params: ControllerParams<TFieldValues>
  ) => React.ReactNode;
};

export type TextareaMetadata = CommonMetadata & {
  type: "textarea";
  resize?: boolean;
};

export type SelectMetadata = CommonMetadata & {
  type: "select";
};

export type RadioMetadata = CommonMetadata & {
  type: "radio";
};

export type ForbidFileProps<T> = T & {
  resize?: never;
};

export type NonFileMetadata = ForbidFileProps<
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
