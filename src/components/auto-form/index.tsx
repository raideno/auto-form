import { useEffect, useState } from "react";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import {
  Badge,
  Button,
  Flex,
  RadioCards,
  ScrollArea,
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
import { getFieldType, groupFields, zodTypeGuards } from "./helpers";

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
import _ from "lodash";

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
  const [isSubmitLoading, setIsSubmitLoading] = useState<boolean>(false);
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

  const createAsyncHandler =
    (
      handler: () => Promise<void> | void,
      setLoading: (loading: boolean) => void,
      loadingStates: [boolean, boolean]
    ) =>
    async () => {
      if (loadingStates[0] || loadingStates[1]) return;

      try {
        setLoading(true);
        await handler();
      } catch (error) {
        console.error("[form-error]:", error);
      } finally {
        setLoading(false);
      }
    };

  const handleSubmitWrapper = createAsyncHandler(
    () => onSubmit?.(form.getValues()),
    setIsSubmitLoading,
    [isSubmitLoading, isCancelLoading]
  );

  const handleErrorWrapper: SubmitErrorHandler<FormValues> = (errors) => {
    console.log("[form-errors]:", errors);
    if (isSubmitLoading || isCancelLoading) return;
    onError?.();
  };

  const handleCancelWrapper = createAsyncHandler(
    () => (onCancel ? onCancel() : form.reset(defaultValues)),
    setIsCancelLoading,
    [isCancelLoading, isSubmitLoading]
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
          isSubmitLoading,
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
}

function Content_<TSchemaType extends z.ZodObject<z.ZodRawShape>>({
  className = "",
  renderField,
}: ContentProps_<TSchemaType>) {
  const { form, fieldGroups, labels } = useAutoForm<TSchemaType>();
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
          <FileUpload
            value={
              currentValue
                ? ([currentValue] as unknown as Array<File>)
                : undefined
            }
            onChange={(files) => {
              form.setValue(
                fieldName,
                files[0] as PathValue<
                  z.output<TSchemaType>,
                  Path<z.output<TSchemaType>>
                >,
                { shouldValidate: true }
              );
            }}
            multiple={isMultiple}
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
            noDuplicates
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
            // minFiles={fieldConfig.minLength}
            // maxFiles={fieldConfig.maxLength}
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
            defaultValue={currentTags}
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
            value={String(currentValue)}
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
                  ? _.startCase(option)
                  : option.label || _.startCase(option.value);
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
            value={String(currentValue)}
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
            <Select.Content className="z-50">
              <ScrollArea type="auto" style={{ maxHeight: "300px" }}>
                <Select.Group>
                  {fieldConfig.enhancedOptions?.map((option) => {
                    const value =
                      typeof option === "string" ? option : option.value;
                    const label =
                      typeof option === "string"
                        ? _.startCase(option)
                        : option.label || _.startCase(option.value);

                    return (
                      <Select.Item key={value} value={value}>
                        {label}
                      </Select.Item>
                    );
                  })}
                </Select.Group>
              </ScrollArea>
            </Select.Content>
          </Select.Root>
        );

      case "text":
      case "email":
      case "password":
      case "url":
      case "number":
      case "date":
      case "time":
      case "datetime-local": {
        const showCharCount =
          ["text", "password", "url"].includes(type) && !!maxLength;
        return (
          <TextField.Root
            size="3"
            type={type}
            placeholder={placeholder}
            maxLength={maxLength}
            {...commonProps}
            {...form.register(fieldName, {
              valueAsNumber: type === "number",
            })}
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

            const defaultRender = () => (
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
                          {renderFormControl(fieldConfig)}
                        </FormControl>
                      </div>
                    ) : (
                      <>
                        {labels && <FormLabel htmlFor={key}>{label}</FormLabel>}
                        <FormControl>
                          {renderFormControl(fieldConfig)}
                        </FormControl>
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

function Actions_({ className = "", children }: ActionsProps_) {
  return (
    <div
      className={cn(
        "w-full flex flex-row items-center justify-end gap-3",
        className
      )}
    >
      {children}
    </div>
  );
}

interface ActionProps_
  extends Omit<ButtonProps, "type" | "onClick" | "disabled"> {
  type?: "submit" | "button" | "reset";
  className?: string;
  children: React.ReactNode;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

function Action_<TSchemaType extends z.ZodObject<z.ZodRawShape>>({
  type = "button",
  className,
  children,
  onClick,
  ...props
}: ActionProps_) {
  const { handleCancel, isSubmitLoading, isCancelLoading } =
    useAutoForm<TSchemaType>();

  const isLoading =
    (type === "submit" && isSubmitLoading) ||
    (type === "reset" && isCancelLoading);
  const isDisabled = isSubmitLoading || isCancelLoading;

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

export { z_ } from "./enhanced-zod";
