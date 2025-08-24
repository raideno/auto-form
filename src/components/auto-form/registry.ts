// registry.tsx

import { z } from "zod/v4";
import type React from "react";
import type { Control, FieldPath, FieldValues } from "react-hook-form";
import type { EnumOption } from "./enhanced-zod";

// NOTE: moved into here in order to keep @ imports in auto.tsx and still be
// able to import registry at build time as @ imports aren't resolved yet

export type Values = Record<string, unknown>;

export type ControllerRenderProps<
  TFieldValues extends FieldValues = FieldValues
> = {
  field: {
    name: FieldPath<TFieldValues>;
    value: unknown;
    onChange: (value: unknown) => void;
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
};

export type RenderParams<TFieldValues extends FieldValues = FieldValues> = {
  fieldConfig: {
    key: string;
    type: string;
    label: string;
    placeholder: string;
    halfWidth: boolean;
    minLength?: number;
    maxLength?: number;
    enhancedOptions?: Array<EnumOption> | null;
    meta?: FieldMetadata;
    fileMaxSize?: number;
    fileMinSize?: number;
    fileMime?: string | string[];
  };
  meta: FieldMetadata | undefined;
  field: {
    name: FieldPath<TFieldValues>;
    value: unknown;
    onChange: (value: unknown) => void;
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
};

export type ControllerParams<TFieldValues extends FieldValues = FieldValues> = {
  fieldConfig: {
    key: string;
    type: string;
    label: string;
    placeholder: string;
    halfWidth: boolean;
    minLength?: number;
    maxLength?: number;
    enhancedOptions?: Array<EnumOption> | null;
    meta?: FieldMetadata;
    fileMaxSize?: number;
    fileMinSize?: number;
    fileMime?: string | string[];
  };
  meta: FieldMetadata | undefined;
  name: FieldPath<TFieldValues>;
  control: Control<TFieldValues>;
  defaultValue?: unknown;
  rules?: object;
  labels: boolean;
  field: {
    name: FieldPath<TFieldValues>;
    value: unknown;
    onChange: (value: unknown) => void;
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
