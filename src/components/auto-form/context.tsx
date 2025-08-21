import { createContext, useContext } from "react";

import type * as z from "zod/v4";
import type { UseFormReturn } from "react-hook-form";

import type { FieldMetadata } from "./registry";
import type { EnumOption } from "./enhanced-zod";

export interface AutoFormContextValue<
  TSchemaType extends z.ZodObject<z.ZodRawShape>
> {
  form: UseFormReturn<z.output<TSchemaType>>;
  schema: TSchemaType;
  isSubmitLoading: boolean;
  isCancelLoading: boolean;
  handleSubmit: (values: z.infer<TSchemaType>) => unknown;
  handleCancel: () => unknown;
  fields: Array<FieldConfig>;
  fieldGroups: Array<FieldGroup>;
  labels: boolean;
}

export interface FieldConfig {
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
}

export type FieldGroup = Array<FieldConfig>;

export const AutoFormContext = createContext<AutoFormContextValue<
  z.ZodObject<z.ZodRawShape>
> | null>(null);

export function useAutoForm<TSchemaType extends z.ZodObject<z.ZodRawShape>>() {
  const context = useContext(AutoFormContext);
  if (!context) {
    throw new Error("useAutoForm must be used within an AutoForm.Root");
  }
  return context as AutoFormContextValue<TSchemaType>;
}
