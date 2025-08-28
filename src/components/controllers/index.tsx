/* eslint-disable @typescript-eslint/no-explicit-any */
import type React from "react";

import type { FieldValues } from "react-hook-form";

import { TextFieldController } from "./text-field";
import { TextAreaController } from "./text-area";
import { NumberController } from "./number";
import { createDateTimeController } from "./datetime";
import { SwitchController } from "./switch";
import { RadioController } from "./radio";
import { SelectController } from "./select";
import { TagsController } from "./tags";
import { FileController } from "./file";
import { FilesController } from "./files";

import type { ControllerParams } from "../auto-form/registry";

type C<TFieldValues extends FieldValues = FieldValues> = (
  params: ControllerParams<TFieldValues>
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
