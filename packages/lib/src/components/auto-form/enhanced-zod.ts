// enhanced-zod.tsx

import { z } from "zod/v4";

export type EnumOption =
  | string
  | {
      value: string;
      label?: string;
      description?: string;
    };

function createEnhancedEnum<T extends readonly [EnumOption, ...EnumOption[]]>(
  options: T
) {
  const values = options.map((option) =>
    typeof option === "string" ? option : option.value
  ) as [string, ...string[]];

  const baseEnum = z.enum(values);

  (
    baseEnum as z.ZodTypeAny & { _enhancedOptions?: readonly EnumOption[] }
  )._enhancedOptions = options;

  return baseEnum;
}

export function hasEnhancedOptions(schema: z.ZodTypeAny): boolean {
  return !!(
    schema as z.ZodTypeAny & { _enhancedOptions?: readonly EnumOption[] }
  )._enhancedOptions;
}

export function getEnhancedOptions(schema: z.ZodTypeAny): EnumOption[] | null {
  const enhancedOptions = (
    schema as z.ZodTypeAny & { _enhancedOptions?: readonly EnumOption[] }
  )._enhancedOptions;
  return enhancedOptions ? [...enhancedOptions] : null;
}

export const z_ = {
  ...z,
  enum: <T extends readonly [EnumOption, ...EnumOption[]]>(options: T) => {
    return createEnhancedEnum(options);
  },
};
