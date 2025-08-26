// helpers.tsx

import z from "zod/v4";

import { MetadataRegistry } from "./registry";
import { getEnhancedOptions } from "./enhanced-zod";

import type { FieldMetadata } from "./registry";
import type { FieldConfig, FieldGroup } from "./context";

export function startCase(str: string): string {
  return (
    str
      .replace(/[_-]+/g, " ")
      // NOTE: split camelCase
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/\s+/g, " ")
      .trim()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ")
  );
}

type ZodUnionTuple = readonly [z.ZodTypeAny, ...z.ZodTypeAny[]];

export const zodTypeGuards = {
  string: (schema: z.ZodTypeAny): schema is z.ZodString =>
    schema.def.type === "string",
  number: (schema: z.ZodTypeAny): schema is z.ZodNumber =>
    schema.def.type === "number",
  boolean: (schema: z.ZodTypeAny): schema is z.ZodBoolean =>
    schema.def.type === "boolean",
  union: (schema: z.ZodTypeAny): schema is z.ZodUnion<ZodUnionTuple> =>
    schema.def.type === "union",
  enum: (schema: z.ZodTypeAny): schema is z.ZodEnum =>
    schema.def.type === "enum",
  object: (schema: z.ZodTypeAny): schema is z.ZodObject<z.ZodRawShape> =>
    schema.def.type === "object",
  // TODO: make sure it is an array of strings or files, or else
  array: (schema: z.ZodTypeAny): schema is z.ZodArray<z.ZodTypeAny> =>
    schema.def.type === "array",
  optional: (schema: z.ZodTypeAny): schema is z.ZodOptional<z.ZodTypeAny> =>
    schema.def.type === "optional",
  nullable: (schema: z.ZodTypeAny): schema is z.ZodNullable<z.ZodTypeAny> =>
    schema.def.type === "nullable",
  date: (schema: z.ZodTypeAny): schema is z.ZodDate =>
    schema.def.type === "date",
  file: (schema: z.ZodTypeAny): schema is z.ZodFile =>
    schema.def.type === "file",
} as const;

export const DEFAULT_PLACEHOLDERS = {
  text: "Enter text",
  textarea: "Enter detailed text",
  email: "Enter email address",
  password: "Enter password",
  url: "Enter URL (https://example.com)",
  number: "Enter number",
  date: "Select date",
  "datetime-local": "Select date and time",
  tags: "Enter tags and press Enter",
  select: "Select an option",
  radio: "Choose an option",
  file: "Upload a file",
  files: "Upload multiple files",
} as const;

function getUploadPlaceholder(
  minLength?: number,
  maxLength?: number
): string | undefined {
  if (minLength != null && maxLength != null) {
    if (minLength === maxLength) {
      return `Upload ${minLength} file${minLength > 1 ? "s" : ""}`;
    }
    return `Upload from ${minLength} to ${maxLength} files`;
  }

  if (maxLength != null) {
    return `Upload up to ${maxLength} file${maxLength > 1 ? "s" : ""}`;
  }

  if (minLength != null) {
    if (minLength === 1) {
      return "Upload at least 1 file";
    }
    return `Upload at least ${minLength} files`;
  }

  return undefined;
}

export const getNumericConstraint = (
  checks: Array<z.core.$ZodCheck<never>>,
  checkType: "max_length" | "min_length" | "greater_than" | "less_than"
): { value: number; inclusive: boolean } | undefined => {
  const check = checks.find((check_) => check_._zod.def.check === checkType);

  if (!check) return undefined;

  switch (checkType) {
    case "max_length":
      if ("maximum" in check._zod.def) {
        return {
          value: (check as z.core.$ZodCheckMaxLength)._zod.def.maximum,
          inclusive: true,
        };
      }
      return undefined;
    case "min_length":
      if ("minimum" in check._zod.def) {
        return {
          value: (check as z.core.$ZodCheckMinLength)._zod.def.minimum,
          inclusive: true,
        };
      }
      return undefined;
    case "greater_than":
      if ("value" in check._zod.def && "inclusive" in check._zod.def) {
        // TODO: careful as the .value is a bigint and it might not fit into a Number
        return {
          value: Number((check as z.core.$ZodCheckGreaterThan)._zod.def.value),
          inclusive: (check as z.core.$ZodCheckGreaterThan)._zod.def.inclusive,
        };
      }
      return undefined;
    case "less_than":
      if ("value" in check._zod.def && "inclusive" in check._zod.def) {
        // TODO: careful as the .value is a bigint and it might not fit into a Number
        return {
          value: Number((check as z.core.$ZodCheckLessThan)._zod.def.value),
          inclusive: (check as z.core.$ZodCheckGreaterThan)._zod.def.inclusive,
        };
      }
      return undefined;
    default:
      return undefined;
  }
};

export const unwrapZodType = (zodType: z.ZodTypeAny): z.ZodTypeAny => {
  let baseType = zodType;
  while (zodTypeGuards.optional(baseType) || zodTypeGuards.nullable(baseType)) {
    baseType = baseType.def.innerType;
  }
  return baseType;
};

export const inferTypeFromKey = (
  key: string,
  currentType: string
): { type: string; placeholder: string } => {
  const keyLower = key.toLowerCase();
  const typeMap = [
    {
      keywords: ["password"],
      type: "password",
      placeholder: DEFAULT_PLACEHOLDERS.password,
    },
    {
      keywords: ["date"],
      excludes: ["update"],
      type: "date",
      placeholder: DEFAULT_PLACEHOLDERS.date,
    },
    {
      keywords: ["url", "href", "link"],
      type: "url",
      placeholder: DEFAULT_PLACEHOLDERS.url,
    },
    {
      keywords: ["email"],
      type: "email",
      placeholder: DEFAULT_PLACEHOLDERS.email,
    },
  ] as const;

  // for (const { keywords, excludes = [], type, placeholder } of typeMap) {
  for (const { keywords, type, placeholder } of typeMap) {
    if (
      keywords.some((k) => keyLower.includes(k)) &&
      // !excludes.some((e) => keyLower.includes(e)) &&
      currentType === "text"
    ) {
      return { type, placeholder };
    }
  }
  return {
    type: currentType,
    placeholder: Object.keys(DEFAULT_PLACEHOLDERS).includes(currentType)
      ? DEFAULT_PLACEHOLDERS[currentType as keyof typeof DEFAULT_PLACEHOLDERS]
      : DEFAULT_PLACEHOLDERS.text,
  };
};

export const getFieldType = (key: string, zodType: unknown): FieldConfig => {
  if (!(zodType instanceof z.ZodType)) {
    console.error(`Expected ZodType for key "${key}", got`, zodType);
    // throw new Error(`Expected ZodType for key "${key}", got ${typeof zodType}`);
  }

  const meta = (MetadataRegistry.get(zodType) || {
    resize: false,
  }) as FieldMetadata;

  const label = meta.label || startCase(key);
  const baseType = unwrapZodType(zodType);

  let fieldType = meta.type || "text";
  let placeholder = meta.placeholder;
  let enhancedOptions: ReturnType<typeof getEnhancedOptions> = null;

  let minLength: number | undefined;
  let maxLength: number | undefined;
  let greaterThan: { value: number; inclusive: boolean } | undefined;
  let lessThan: { value: number; inclusive: boolean } | undefined;

  let fileMinSize: number | undefined = 1;
  let fileMaxSize: number | undefined = 256;
  let fileMime: string | string[] | undefined = [];

  if (zodTypeGuards.boolean(baseType) || meta.type === "switch") {
    fieldType = "switch";
    placeholder = "";
  } else if (zodTypeGuards.array(baseType)) {
    const arrayElementType = baseType.def.element;
    const checks = (baseType.def.checks ?? []) as Array<
      z.core.$ZodCheck<never>
    >;
    if (zodTypeGuards.file(arrayElementType)) {
      fieldType = "files";
      minLength = getNumericConstraint(checks, "min_length")?.value;
      maxLength = getNumericConstraint(checks, "max_length")?.value;

      placeholder =
        placeholder ||
        getUploadPlaceholder(minLength, maxLength) ||
        DEFAULT_PLACEHOLDERS.files;

      fileMinSize = arrayElementType._zod.bag.minimum;
      fileMaxSize = arrayElementType._zod.bag.maximum;
      fileMime = arrayElementType._zod.bag.mime;
    } else if (zodTypeGuards.string(arrayElementType)) {
      fieldType = "tags";
      placeholder = placeholder || DEFAULT_PLACEHOLDERS.tags;
      minLength = getNumericConstraint(checks, "min_length")?.value;
      maxLength = getNumericConstraint(checks, "max_length")?.value;
    } else {
      // throw new Error("Only string and file arrays are supported.");
      console.error(
        `Only string and file arrays are supported. "${key}":`,
        zodType
      );
      fieldType = "unsupported";
    }
  } else if (zodTypeGuards.file(baseType)) {
    fileMinSize = baseType._zod.bag.minimum;
    fileMaxSize = baseType._zod.bag.maximum;
    fileMime = baseType._zod.bag.mime;

    fieldType = "file";
    placeholder = placeholder || DEFAULT_PLACEHOLDERS.file;
  } else if (zodTypeGuards.enum(baseType)) {
    enhancedOptions = getEnhancedOptions(zodType);

    fieldType = meta.type === "radio" ? "radio" : "select";
    placeholder =
      placeholder ||
      (meta.type === "radio"
        ? DEFAULT_PLACEHOLDERS.radio
        : DEFAULT_PLACEHOLDERS.select);

    if (!enhancedOptions) {
      if (baseType.options.every((option) => typeof option === "string")) {
        enhancedOptions = [...baseType.options];
      } else {
        throw new Error("Enum must be strings only.");
      }
    }
  } else if (zodTypeGuards.string(baseType)) {
    const checks = (baseType.def.checks ?? []) as Array<
      z.core.$ZodCheck<never>
    >;
    const maxLengthConstraint = getNumericConstraint(
      checks,
      "max_length"
    )?.value;
    const minLengthConstraint = getNumericConstraint(
      checks,
      "min_length"
    )?.value;

    if (maxLengthConstraint) maxLength = maxLengthConstraint;

    const TEXTAREA_THRESHOLD = 200;
    if (
      (minLengthConstraint && minLengthConstraint > TEXTAREA_THRESHOLD) ||
      (maxLengthConstraint && maxLengthConstraint > TEXTAREA_THRESHOLD) ||
      meta.type === "textarea"
    ) {
      fieldType = "textarea";
      placeholder = placeholder || DEFAULT_PLACEHOLDERS.textarea;
    } else {
      const formatChecks = [
        {
          check: "url",
          type: "url" as const,
          placeholder: DEFAULT_PLACEHOLDERS.url,
        },
        {
          check: "email",
          type: "email" as const,
          placeholder: DEFAULT_PLACEHOLDERS.email,
        },
      ] as const;

      for (const {
        check,
        type,
        placeholder: formatPlaceholder,
      } of formatChecks) {
        if (checks.some((c) => c._zod.def.check === check)) {
          fieldType = type;
          placeholder = placeholder || formatPlaceholder;
          break;
        }
      }

      if (key.toLowerCase().includes("password")) {
        fieldType = "password";
        placeholder = placeholder || DEFAULT_PLACEHOLDERS.password;
      }
    }
  } else if (zodTypeGuards.date(baseType)) {
    fieldType = "date";
    placeholder = placeholder || DEFAULT_PLACEHOLDERS.date;
  } else if (zodTypeGuards.number(baseType)) {
    const checks = (baseType.def.checks ?? []) as Array<
      z.core.$ZodCheck<never>
    >;
    const greaterThanConstraint = getNumericConstraint(checks, "greater_than");
    const lessThanConstraint = getNumericConstraint(checks, "less_than");

    fieldType = "number";
    placeholder = placeholder || DEFAULT_PLACEHOLDERS.number;

    if (greaterThanConstraint) {
      greaterThan = greaterThanConstraint;
    }
    if (lessThanConstraint) {
      lessThan = lessThanConstraint;
    }
  } else {
    console.error(`Unsupported Zod type for key "${key}":`, zodType);
    // throw new Error("Unsupported Zod type");
    fieldType = "unsupported";
  }

  if (!meta.placeholder) {
    const inferred = inferTypeFromKey(key, fieldType);
    fieldType = inferred.type;
    placeholder = placeholder || inferred.placeholder;
  }

  return {
    key,
    type: fieldType,
    label,
    placeholder: placeholder || DEFAULT_PLACEHOLDERS.text,
    halfWidth: meta.halfWidth || false,
    minLength,
    maxLength,
    greaterThan,
    lessThan,
    enhancedOptions,
    meta,
    fileMaxSize,
    fileMinSize,
    fileMime,
  };
};

export const groupFields = (fields: Array<FieldConfig>): Array<FieldGroup> => {
  const fieldGroups: Array<FieldGroup> = [];
  let currentGroup: Array<FieldConfig> = [];

  fields.forEach((field) => {
    if (field.halfWidth) {
      currentGroup.push(field);
      if (currentGroup.length === 2) {
        fieldGroups.push([...currentGroup]);
        currentGroup = [];
      }
    } else {
      if (currentGroup.length > 0) {
        fieldGroups.push([...currentGroup]);
        currentGroup = [];
      }
      fieldGroups.push([field]);
    }
  });

  if (currentGroup.length > 0) {
    fieldGroups.push([...currentGroup]);
  }

  return fieldGroups;
};
