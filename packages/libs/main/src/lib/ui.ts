"use client";

import "./styles.css";

export { useAutoForm } from "@/components/auto-form/context";
export { AutoForm } from "@/components/auto-form/ui";

export type {
  AutoFormContextValue,
  FieldConfig,
  FieldGroup,
} from "@/components/auto-form/context";

export * from "@/components/ui/file-upload";
export * from "@/components/ui/tag-input";
