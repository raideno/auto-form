// ui.tsx

import { useEffect, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import {
  Badge,
  Button,
  Flex,
  IconButton,
  RadioCards,
  Select,
  Switch,
  Text,
  TextArea,
  TextField,
} from "@radix-ui/themes";
import { useForm } from "react-hook-form";

import type React from "react";
import type * as z from "zod/v4";
import type { Path, PathValue, SubmitErrorHandler } from "react-hook-form";
import type { ButtonProps } from "@radix-ui/themes";
import type { AutoFormContextValue, FieldConfig } from "./context";

import { AutoFormContext, useAutoForm } from "./context";
import { getFieldType, groupFields, startCase, zodTypeGuards } from "./helpers";

import { cn } from "@/lib/utils";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { TagInput } from "@/components/ui/tag-input";
import { FileUpload } from "@/components/ui/file-upload";

import { InputFileUpload } from "../ui/input-file-upload";
import { MinusIcon, PlusIcon } from "@radix-ui/react-icons";

interface RootProps_<TSchemaType extends z.ZodObject<z.ZodRawShape>> {
  schema: TSchemaType;
  defaultValues?: z.output<TSchemaType>;
  onSubmit?: (values: z.infer<TSchemaType>) => Promise<void> | void;
  onCancel?: () => void;
  onError?: () => void;
  onChange?: (values: z.infer<TSchemaType>) => void;
  className?: string;
  children: React.ReactNode;
  labels?: boolean;
}

function Root_<TSchemaType extends z.ZodObject<z.ZodRawShape>>({
  schema,
  defaultValues,
  onSubmit,
  onCancel,
  onError,
  onChange,
  className = "",
  children,
  labels = true,
}: RootProps_<TSchemaType>) {
  const [isCancelLoading, setIsCancelLoading] = useState<boolean>(false);

  if (!zodTypeGuards.object(schema))
    throw new Error(
      "AutoForm Error: The provided schema must be an instance of z.ZodObject."
    );

  type FormValues = z.output<TSchemaType>;

  const form = useForm<FormValues>({
    resolver: standardSchemaResolver(schema),
    defaultValues: defaultValues && (async () => await defaultValues),
  });

  useEffect(() => {
    if (onChange) {
      const subscription = form.watch((value) => {
        onChange(value as z.infer<TSchemaType>);
      });
      return () => subscription.unsubscribe();
    }
  }, [form, onChange]);

  function withLoading<TArgs extends unknown[]>(
    fn: (...args: TArgs) => Promise<void> | void,
    setLoading: (loading: boolean) => void,
    isBlocked: () => boolean
  ) {
    return async (...args: TArgs) => {
      if (isBlocked()) return;
      try {
        setLoading(true);
        await fn(...args);
      } catch (error) {
        console.error("[form-error]:", error);
      } finally {
        setLoading(false);
      }
    };
  }

  const handleSubmitWrapper = (values: FormValues) => onSubmit?.(values);

  const handleErrorWrapper: SubmitErrorHandler<FormValues> = (errors) => {
    console.error("[form-errors]:", errors);
    if (form.formState.isSubmitting || isCancelLoading) return;
    onError?.();
  };

  const handleCancelWrapper = withLoading(
    () => (onCancel ? onCancel() : form.reset(defaultValues)),
    setIsCancelLoading,
    () => form.formState.isSubmitting || isCancelLoading
  );

  const fields: Array<FieldConfig> = Object.entries(schema.shape).map(
    ([key, zodType]) => getFieldType(key, zodType)
  );

  const fieldGroups = groupFields(fields);

  return (
    <AutoFormContext.Provider
      value={
        {
          form,
          schema,
          isCancelLoading,
          handleSubmit: handleSubmitWrapper,
          handleCancel: handleCancelWrapper,
          fields,
          fieldGroups,
          labels,
        } as AutoFormContextValue<TSchemaType>
      }
    >
      <Form {...form}>
        <form
          className={className}
          onSubmit={form.handleSubmit(handleSubmitWrapper, handleErrorWrapper)}
          noValidate
        >
          {children}
        </form>
      </Form>
    </AutoFormContext.Provider>
  );
}

interface ContentProps_<TSchemaType extends z.ZodObject<z.ZodRawShape>> {
  className?: string;
  renderField?: (params: {
    field: FieldConfig;
    renderDefault: () => React.ReactNode;
    form: AutoFormContextValue<TSchemaType>["form"];
  }) => React.ReactNode;
  // New: optionally select which fields to render (in the specified order).
  // If not provided or empty, all fields will be rendered (current behavior).
  fields?: Array<Path<z.infer<TSchemaType>>>;
}

function Content_<TSchemaType extends z.ZodObject<z.ZodRawShape>>({
  className = "",
  renderField,
  fields: selectedFieldKeys,
}: ContentProps_<TSchemaType>) {
  const { form, fields: allFields, labels } = useAutoForm<TSchemaType>();
  const values = form.watch();

  const evaluateConditional = <T,>(
    value: T | ((values: z.output<TSchemaType>) => T) | undefined,
    defaultValue: T
  ): T => {
    if (value === undefined) return defaultValue;
    if (typeof value === "function") {
      try {
        return (value as (values: z.output<TSchemaType>) => T)(values);
      } catch (error) {
        console.error("Error evaluating conditional metadata:", error);
        return defaultValue;
      }
    }
    return value;
  };

  const createControllerParams = (
    fieldConfig: FieldConfig,
    fieldName: Path<z.infer<TSchemaType>>
  ) => {
    const set =
      <N extends Path<z.output<TSchemaType>>>(name: N) =>
      (
        value: PathValue<z.output<TSchemaType>, N>,
        options = { shouldValidate: true as const }
      ) =>
        form.setValue(name, value, options);

    const fieldState = form.getFieldState(fieldName);
    const currentValue = form.watch(fieldName);

    return {
      fieldConfig,
      meta: fieldConfig.meta,
      name: fieldName,
      control: form.control,
      defaultValue: form.getValues(fieldName),
      labels,
      field: {
        name: fieldName,
        value: currentValue,
        onChange: (value: unknown) =>
          set(fieldName)(
            value as PathValue<
              z.output<TSchemaType>,
              Path<z.output<TSchemaType>>
            >
          ),
        onBlur: () => form.trigger(fieldName),
      },
      fieldState: {
        invalid: !!fieldState.error,
        error: fieldState.error,
      },
      formState: {
        isSubmitting: form.formState.isSubmitting,
        isLoading: form.formState.isLoading,
      },
      defaultController: renderFormControl(fieldConfig),
    };
  };

  const renderFormControl = (fieldConfig: FieldConfig) => {
    const { key, type, placeholder, maxLength, minLength, meta } = fieldConfig;
    const fieldName = key as Path<z.infer<TSchemaType>>;

    const isDisabled = evaluateConditional(meta?.disabled, false);
    const isReadOnly = evaluateConditional(meta?.readonly, false);
    const isMultiple = Array.isArray(form.watch(fieldName));
    const currentValue = form.watch(fieldName);

    const commonProps = { disabled: isDisabled, readOnly: isReadOnly };

    switch (type) {
      case "file":
        return (
          <InputFileUpload
            value={currentValue ? (currentValue as unknown as File) : undefined}
            onChange={(file) => {
              form.setValue(
                fieldName,
                file as PathValue<
                  z.output<TSchemaType>,
                  Path<z.output<TSchemaType>>
                >,
                { shouldValidate: true }
              );
            }}
            disabled={currentValue != undefined}
            placeholder={placeholder}
            accept={
              Array.isArray(fieldConfig.fileMime)
                ? fieldConfig.fileMime.join(",")
                : fieldConfig.fileMime
            }
            minSize={fieldConfig.fileMinSize}
            maxSize={fieldConfig.fileMaxSize}
          />
        );
      case "files":
        return (
          <FileUpload
            value={
              currentValue
                ? Array.isArray(currentValue)
                  ? currentValue
                  : ([currentValue] as unknown as Array<File>)
                : undefined
            }
            onChange={(files) => {
              form.setValue(
                fieldName,
                files as PathValue<
                  z.output<TSchemaType>,
                  Path<z.output<TSchemaType>>
                >,
                { shouldValidate: true }
              );
            }}
            multiple={isMultiple}
            disabled={
              fieldConfig.maxLength
                ? ((form.getValues(fieldName) as Array<File>) || []).length >=
                  fieldConfig.maxLength
                : false
            }
            placeholder={placeholder}
            accept={
              Array.isArray(fieldConfig.fileMime)
                ? fieldConfig.fileMime.join(",")
                : fieldConfig.fileMime
            }
            minSize={fieldConfig.fileMinSize}
            maxSize={fieldConfig.fileMaxSize}
          />
        );

      case "textarea":
        return (
          <TextArea
            size={"3"}
            placeholder={placeholder}
            className={cn(
              "min-h-[80px]",
              meta?.type === "textarea" && meta?.resize && "resize-y"
            )}
            id={String(fieldName)}
            maxLength={maxLength}
            {...commonProps}
            {...form.register(fieldName)}
          />
        );

      case "tags": {
        const currentTags = (currentValue || []) as Array<string>;
        return (
          <TagInput.Root
            maxTags={maxLength}
            minTags={minLength}
            className="space-y-2"
            value={currentTags}
            onValueChange={(newTags) => {
              form.setValue(
                fieldName,
                newTags as PathValue<
                  z.output<TSchemaType>,
                  Path<z.output<TSchemaType>>
                >
              );
            }}
          >
            <TagInput.Input
              size={"3"}
              disabled={
                isDisabled ||
                (maxLength !== undefined && currentTags.length >= maxLength)
              }
              readOnly={isReadOnly}
              placeholder={placeholder}
            >
              {maxLength && (
                <TagInput.Slot side="right">
                  {currentTags.length} / {maxLength}
                </TagInput.Slot>
              )}
            </TagInput.Input>
            <TagInput.Content />
          </TagInput.Root>
        );
      }

      case "switch":
        return (
          <Switch
            checked={!!currentValue}
            disabled={isDisabled}
            onCheckedChange={(checked) => {
              form.setValue(
                fieldName,
                checked as PathValue<
                  z.output<TSchemaType>,
                  Path<z.output<TSchemaType>>
                >,
                { shouldValidate: true }
              );
            }}
          />
        );

      case "radio":
        return (
          <RadioCards.Root
            size={"3"}
            value={currentValue == null ? undefined : String(currentValue)}
            disabled={isDisabled}
            onValueChange={(value) => {
              form.setValue(
                fieldName,
                value as PathValue<
                  z.output<TSchemaType>,
                  Path<z.output<TSchemaType>>
                >,
                { shouldValidate: true }
              );
            }}
          >
            {fieldConfig.enhancedOptions?.map((option) => {
              const value = typeof option === "string" ? option : option.value;
              const label =
                typeof option === "string"
                  ? startCase(option)
                  : option.label || startCase(option.value);
              const description =
                typeof option === "string" ? undefined : option.description;

              return (
                <RadioCards.Item key={value} value={value}>
                  <Flex direction="column" width="100%">
                    <Text weight="bold">{label}</Text>
                    {description && (
                      <Text size="2" color="gray">
                        {description}
                      </Text>
                    )}
                  </Flex>
                </RadioCards.Item>
              );
            })}
          </RadioCards.Root>
        );

      case "select":
        return (
          <Select.Root
            size={"3"}
            value={currentValue == null ? undefined : String(currentValue)}
            disabled={isDisabled}
            onValueChange={(value) => {
              form.setValue(
                fieldName,
                value as PathValue<
                  z.output<TSchemaType>,
                  Path<z.output<TSchemaType>>
                >,
                { shouldValidate: true }
              );
            }}
          >
            <Select.Trigger className="w-full" placeholder={placeholder} />
            <ErrorBoundary
              FallbackComponent={(props) => {
                console.error("[select-error]:", props.error);
                return <></>;
              }}
            >
              <Select.Content className="z-50">
                {fieldConfig.enhancedOptions?.map((option) => {
                  const value =
                    typeof option === "string" ? option : option.value;
                  const label =
                    typeof option === "string"
                      ? startCase(option)
                      : option.label || startCase(option.value);

                  return (
                    <Select.Item key={value} value={value}>
                      {label}
                    </Select.Item>
                  );
                })}
              </Select.Content>
            </ErrorBoundary>
          </Select.Root>
        );

      case "text":
      case "email":
      case "password":
      case "url": {
        const showCharCount =
          ["text", "password", "url"].includes(type) && !!maxLength;
        return (
          <TextField.Root
            size="3"
            type={type}
            placeholder={placeholder}
            maxLength={maxLength}
            id={String(fieldName)}
            {...commonProps}
            {...form.register(fieldName)}
          >
            {showCharCount && (
              <TextField.Slot side="right">
                <Badge color="gray" variant="soft">
                  {String(currentValue || "").length} / {maxLength}
                </Badge>
              </TextField.Slot>
            )}
          </TextField.Root>
        );
      }

      case "date":
      case "time":
      case "datetime-local": {
        return (
          <TextField.Root
            size="3"
            type={type}
            placeholder={placeholder}
            id={String(fieldName)}
            {...commonProps}
            {...form.register(fieldName, {
              setValueAs: (v) => {
                if (!v) return undefined;
                try {
                  return new Date(v);
                } catch {
                  return undefined;
                }
              },
            })}
          />
        );
      }

      case "number": {
        const showControls = !!meta?.withControls;
        return (
          <TextField.Root
            size="3"
            type="number"
            placeholder={placeholder}
            id={String(fieldName)}
            {...commonProps}
            {...form.register(fieldName, {
              setValueAs: (v) =>
                v === "" || v == null ? undefined : Number(v),
            })}
          >
            {showControls && (
              <TextField.Slot side="right">
                <div className="flex items-center gap-1">
                  <IconButton
                    variant="soft"
                    size="1"
                    type="button"
                    disabled={
                      isDisabled ||
                      isReadOnly ||
                      (fieldConfig.greaterThan
                        ? fieldConfig.greaterThan.inclusive
                          ? Number(currentValue) <=
                            fieldConfig.greaterThan.value
                          : Number(currentValue) < fieldConfig.greaterThan.value
                        : false)
                    }
                    onClick={(e) => {
                      e.preventDefault();
                      const curr = Number(currentValue ?? 0);
                      const next = !fieldConfig.greaterThan
                        ? (Number.isNaN(curr) ? 0 : curr) -
                          (fieldConfig.meta?.step || 1)
                        : Math.max(
                            (Number.isNaN(curr) ? 0 : curr) -
                              (fieldConfig.meta?.step || 1),
                            fieldConfig.greaterThan.value
                          );
                      form.setValue(
                        fieldName,
                        next as PathValue<
                          z.output<TSchemaType>,
                          Path<z.output<TSchemaType>>
                        >,
                        { shouldValidate: true }
                      );
                    }}
                    aria-label="Decrement"
                    title="Decrement"
                  >
                    <MinusIcon />
                  </IconButton>
                  <IconButton
                    variant="soft"
                    size="1"
                    type="button"
                    disabled={
                      isDisabled ||
                      isReadOnly ||
                      (fieldConfig.lessThan
                        ? fieldConfig.lessThan.inclusive
                          ? Number(currentValue) >= fieldConfig.lessThan.value
                          : Number(currentValue) > fieldConfig.lessThan.value
                        : false)
                    }
                    onClick={(e) => {
                      e.preventDefault();
                      const curr = Number(currentValue ?? 0);
                      const next = !fieldConfig.lessThan
                        ? (Number.isNaN(curr) ? 0 : curr) +
                          (fieldConfig.meta?.step || 1)
                        : Math.min(
                            (Number.isNaN(curr) ? 0 : curr) +
                              (fieldConfig.meta?.step || 1),
                            fieldConfig.lessThan.value
                          );
                      form.setValue(
                        fieldName,
                        next as PathValue<
                          z.output<TSchemaType>,
                          Path<z.output<TSchemaType>>
                        >,
                        { shouldValidate: true }
                      );
                    }}
                    aria-label="Increment"
                    title="Increment"
                  >
                    <PlusIcon />
                  </IconButton>
                </div>
              </TextField.Slot>
            )}
          </TextField.Root>
        );
      }

      case "unknown":
        return <div>Unsupported field type. Use a custom controller.</div>;

      default:
        console.warn(
          `AutoForm: Unsupported field type "${type}" for key "${key}". Rendering default text input.`
        );
        return (
          <TextField.Root
            size="3"
            type="text"
            placeholder={placeholder}
            {...commonProps}
            {...form.register(fieldName)}
          />
        );
    }
  };

  // Determine which fields to render (and in which order) and group them.
  const fieldsToRender: Array<FieldConfig> =
    selectedFieldKeys && selectedFieldKeys.length > 0
      ? (selectedFieldKeys
          .map((k) => {
            const found = allFields.find((f) => f.key === (k as string));
            if (!found) {
              console.warn(
                `[AutoForm.Content] Field key "${String(
                  k
                )}" not found in schema.`
              );
            }
            return found;
          })
          .filter(Boolean) as Array<FieldConfig>)
      : allFields;

  const fieldGroups = groupFields(fieldsToRender);

  return (
    <div className={cn("w-full flex flex-col gap-4", className)}>
      {fieldGroups.map((group, groupIndex) => (
        <div
          key={`group-${groupIndex}`}
          className={cn(
            "w-full grid gap-4",
            group.length > 1 ? "grid-cols-2" : "grid-cols-1"
          )}
        >
          {group.map((fieldConfig) => {
            const { key, type, label, meta } = fieldConfig;
            const fieldName = key as Path<z.infer<TSchemaType>>;

            const isHidden = evaluateConditional(meta?.hidden, false);
            if (isHidden) return null;

            const defaultRender = () => {
              return (
                <FormField
                  key={key}
                  control={form.control}
                  name={fieldName}
                  render={() => (
                    <FormItem className="w-full flex flex-col">
                      {type === "switch" ? (
                        <div className="flex flex-row items-center justify-between space-x-3 py-4">
                          {labels && (
                            <Flex direction={"column"} gap={"1"}>
                              <FormLabel htmlFor={key}>{label}</FormLabel>
                              {meta?.description && (
                                <Text size="2" color="gray">
                                  {meta.description}
                                </Text>
                              )}
                            </Flex>
                          )}
                          <FormControl>
                            {meta?.controller
                              ? meta.controller(
                                  createControllerParams(fieldConfig, fieldName)
                                )
                              : renderFormControl(fieldConfig)}
                          </FormControl>
                        </div>
                      ) : (
                        <>
                          {labels && (
                            <FormLabel htmlFor={key}>{label}</FormLabel>
                          )}
                          <ErrorBoundary
                            FallbackComponent={(props) => {
                              console.error("[field-error]:", props.error);
                              return (
                                <div>Failed to load field controller.</div>
                              );
                            }}
                          >
                            <FormControl>
                              {meta?.controller
                                ? meta.controller(
                                    createControllerParams(
                                      fieldConfig,
                                      fieldName
                                    )
                                  )
                                : renderFormControl(fieldConfig)}
                            </FormControl>
                          </ErrorBoundary>
                          {meta?.description && (
                            <Text size="2" color="gray">
                              {meta.description}
                            </Text>
                          )}
                        </>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              );
            };

            if (meta?.renderer) {
              const fieldState = form.getFieldState(fieldName);
              const currentValue = form.watch(fieldName);

              const controllerComponent = meta?.controller
                ? meta.controller(
                    createControllerParams(fieldConfig, fieldName)
                  )
                : renderFormControl(fieldConfig);

              return meta.renderer({
                fieldConfig,
                meta,
                field: {
                  name: fieldName,
                  value: currentValue,
                  onChange: (value: unknown) => {
                    form.setValue(
                      fieldName,
                      value as PathValue<
                        z.output<TSchemaType>,
                        Path<z.output<TSchemaType>>
                      >,
                      { shouldValidate: true }
                    );
                  },
                  onBlur: () => form.trigger(fieldName),
                },
                fieldState: {
                  invalid: !!fieldState.error,
                  error: fieldState.error,
                },
                formState: {
                  isSubmitting: form.formState.isSubmitting,
                  isLoading: form.formState.isLoading,
                },
                labels,
                controller: controllerComponent,
                defaultRender,
              });
            }
            return renderField
              ? renderField({
                  field: fieldConfig,
                  renderDefault: defaultRender,
                  form,
                })
              : defaultRender();
          })}
        </div>
      ))}
    </div>
  );
}

interface ActionsProps_ {
  className?: string;
  children: React.ReactNode;
}

function Actions_({ className, children }: ActionsProps_) {
  return <div className={cn(className)}>{children}</div>;
}

interface ActionProps_
  extends Omit<ButtonProps, "type" | "onClick" | "disabled"> {
  type?: "submit" | "button" | "reset";
  className?: string;
  children: React.ReactNode;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

function Action_({
  type = "button",
  className,
  children,
  onClick,
  ...props
}: ActionProps_) {
  const { handleCancel, isCancelLoading, form } =
    useAutoForm<z.ZodObject<z.ZodRawShape>>();

  const isLoading =
    (type === "submit" && form.formState.isSubmitting) ||
    (type === "reset" && isCancelLoading);
  const isDisabled = form.formState.isSubmitting || isCancelLoading;

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (isDisabled) {
      event.preventDefault();
      return;
    }
    if (type === "reset") {
      event.preventDefault();
      handleCancel();
    } else if (type === "button" && onClick) {
      onClick(event);
    }
  };

  return (
    <Button
      type={type}
      className={cn(className)}
      onClick={handleClick}
      disabled={isDisabled}
      loading={isLoading}
      {...props}
    >
      {children}
    </Button>
  );
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace AutoForm {
  export type RootProps<TSchemaType extends z.ZodObject<z.ZodRawShape>> =
    RootProps_<TSchemaType>;
  export const Root = Root_;
  export type ContentProps<TSchemaType extends z.ZodObject<z.ZodRawShape>> =
    ContentProps_<TSchemaType>;
  export const Content = Content_;
  export type ActionsProps = ActionsProps_;
  export const Actions = Actions_;
  export type ActionProps = ActionProps_;
  export const Action = Action_;
}
