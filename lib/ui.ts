"use client";

import "./styles.css";

export { AutoForm } from "../src/components/auto-form/ui";
export { useAutoForm } from "../src/components/auto-form/context";

export type {
  AutoFormContextValue,
  FieldConfig,
  FieldGroup,
} from "../src/components/auto-form/context";
