/* eslint-disable @typescript-eslint/no-explicit-any */
import type React from "react";

import type { FieldValues } from "react-hook-form";

import { createDateTimeController } from "@/components/controllers/datetime";
import { FileController } from "@/components/controllers/file";
import { FilesController } from "@/components/controllers/files";
import { NumberController } from "@/components/controllers/number";
import { RadioController } from "@/components/controllers/radio";
import { SelectController } from "@/components/controllers/select";
import { SwitchController } from "@/components/controllers/switch";
import { TagsController } from "@/components/controllers/tags";
import { TextAreaController } from "@/components/controllers/text-area";
import { TextFieldController } from "@/components/controllers/text-field";

import type { ControllerParams } from "../auto-form/registry";

type C<TFieldValues extends FieldValues = FieldValues> = (
  params: ControllerParams<TFieldValues, any>
) => React.ReactNode;

export const DefaultControllers: Record<string, C<any>> = {
  // text-like
  text: TextFieldController,
  email: TextFieldController,
  password: TextFieldController,
  url: TextFieldController,

  // textarea
  textarea: TextAreaController,

  // numbers
  number: NumberController,

  // date/time
  date: createDateTimeController("date"),
  time: createDateTimeController("time"),
  "datetime-local": createDateTimeController("datetime-local"),

  // boolean
  switch: SwitchController,

  // enums
  radio: RadioController,
  select: SelectController,

  // arrays
  tags: TagsController,

  // files
  file: FileController,
  files: FilesController,
};

export function getDefaultController<
  TFieldValues extends FieldValues = FieldValues
>(type: string): C<TFieldValues> {
  const c = DefaultControllers[type] as C<TFieldValues> | undefined;
  if (!c) {
    // Fallback to text input if we don't recognize the type
    return DefaultControllers.text as C<TFieldValues>;
  }
  return c;
}
