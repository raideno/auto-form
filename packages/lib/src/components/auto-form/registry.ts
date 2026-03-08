// registry.tsx

import { z } from "zod/v4";
import type React from "react";
import type { FieldPath, FieldValues } from "react-hook-form";
// import type { EnumOption } from "./enhanced-zod";
import type { AutoFormContextValue, FieldConfig } from "./context";

// NOTE: moved into here in order to keep @ imports in auto.tsx and still be
// able to import registry at build time as @ imports aren't resolved yet

export type Values = Record<string, unknown>;

/**
 * Primitive-only metadata shape used inside RenderParams/ControllerParams.
 * It intentionally omits `renderer` and `controller` to break the circular
 * type reference:
 *   FieldConfig.meta → FieldMetadata → CommonMetadata → renderer/controller
 *   → RenderParams/ControllerParams → fieldConfig: FieldConfig → …
 */
export type BaseMetadata = {
  disabled?: boolean | ((values: Values) => boolean);
  hidden?: boolean | ((values: Values) => boolean);
  readonly?: boolean | ((values: Values) => boolean);
  placeholder?: string;
  description?: string;
  label?: string;
  withControls?: boolean;
  step?: number;
  halfWidth?: boolean;
  resize?: boolean;
  type?: string;
  // renderer / controller are intentionally absent here
};

/**
 * A fully independent (non-derived) FieldConfig-like type whose `meta` is the
 * non-circular BaseMetadata. Defined standalone — NOT via Omit<FieldConfig,…>
 * — so that TypeScript never needs to expand FieldConfig (and therefore
 * FieldMetadata → CommonMetadata → renderer/controller) while checking
 * RenderParams or ControllerParams.
 */
export type FieldConfigBase = {
  key: string;
  type: string;
  label: string;
  placeholder: string;
  halfWidth: boolean;
  minLength?: number;
  maxLength?: number;
  greaterThan?: { value: number; inclusive?: boolean };
  lessThan?: { value: number; inclusive?: boolean };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  enhancedOptions?: Array<any> | null;
  meta?: BaseMetadata;
  fileMaxSize?: number;
  fileMinSize?: number;
  fileMime?: string | string[];
  objectFields?: FieldConfigBase[];
};

export type RenderParams<
  TFieldValues extends FieldValues = FieldValues,
  Type = unknown
> = {
  fieldConfig: FieldConfigBase;
  meta: BaseMetadata | undefined;
  context: unknown;
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
  controller: unknown;
  defaultRender: () => unknown;
  ui: {
    disabled: boolean;
    readOnly: boolean;
  };
};

export type ControllerParams<
  TFieldValues extends FieldValues = FieldValues,
  Type = unknown
> = {
  fieldConfig: FieldConfigBase;
  meta: BaseMetadata | undefined;
  labels: boolean;
  context: unknown;
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
  defaultController: unknown;
  /**
   * Renders a list of field configs as form fields.
   * Provided for object (and custom) controllers so they can render
   * nested fields without re-implementing the rendering logic.
   */
  renderFields: (fields: FieldConfigBase[]) => unknown;
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
