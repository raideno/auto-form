/**
 * AutoForm - Automatic form generation from Zod schemas
 *
 * @example
 * ```tsx
 * <AutoForm.Root
 *   schema={mySchema}
 *   defaultValues={initialData}
 *   onSubmit={(data, tag, helpers) => {
 *     // Handle different action button tags
 *     if (tag === "save") {
 *       await saveData(data);
 *     } else if (tag === "draft") {
 *       await saveDraft(data);
 *     } else if (tag === "cancel") {
 *       helpers.reset(); // Reset to default values
 *     } else if (tag === "clear") {
 *       helpers.clear(); // Clear all fields
 *     }
 *     // Default submit (no tag)
 *   }}
 * >
 *   <AutoForm.Content />
 *   <AutoForm.Actions>
 *     <AutoForm.Action tag="cancel" variant="soft">Cancel</AutoForm.Action>
 *     <AutoForm.Action tag="draft" variant="soft">Save Draft</AutoForm.Action>
 *     <AutoForm.Action tag="save" variant="classic">Save</AutoForm.Action>
 *   </AutoForm.Actions>
 * </AutoForm.Root>
 * ```
 *
 * Helper functions available in onSubmit:
 * - `helpers.reset()` - Reset form to default values
 * - `helpers.clear()` - Clear all form fields
 * - `helpers.setValue(name, value)` - Set a specific field value
 * - `helpers.setError(field, message)` - Set a field error
 */
import { useEffect, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { Button, Flex, Text } from "@radix-ui/themes";
import { useForm } from "react-hook-form";

import type React from "react";
import type * as z from "zod/v4";
import type { Path, PathValue, SubmitErrorHandler } from "react-hook-form";
import type { ButtonProps } from "@radix-ui/themes";
import type { AutoFormContextValue, FieldConfig, FormHelpers } from "./context";

import { AutoFormContext, useAutoForm } from "./context";
import {
  getFieldType,
  groupFields,
  renderRichText,
  zodTypeGuards,
} from "./helpers";
import { cn } from "@/lib/utils";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { getDefaultController } from "../controllers";
import type { ControllerParams } from "./registry";

interface RootProps_<TSchemaType extends z.ZodObject<z.ZodRawShape>> {
  schema: TSchemaType;
  defaultValues?: z.output<TSchemaType>;
  onSubmit?: (
    data: z.infer<TSchemaType>,
    tag: string | undefined,
    helpers: FormHelpers<TSchemaType>
  ) => Promise<void> | void;
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
  onError,
  onChange,
  className = "",
  children,
  labels = true,
}: RootProps_<TSchemaType>) {
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);

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

  const createHelpers = (): FormHelpers<TSchemaType> => ({
    reset: () => form.reset(defaultValues),
    clear: () => {
      const emptyValues = Object.keys(schema.shape).reduce((acc, key) => {
        acc[key as keyof FormValues] = undefined as any;
        return acc;
      }, {} as FormValues);
      form.reset(emptyValues);
    },
    setValue: (name, value) => {
      form.setValue(
        name as unknown as Path<FormValues>,
        value as PathValue<FormValues, Path<FormValues>>,
        { shouldValidate: true }
      );
    },
    setError: (field, message) => {
      form.setError(field as unknown as Path<FormValues>, { message });
    },
  });

  const handleActionSubmitWrapper = async (
    tag: string | undefined,
    values: FormValues
  ) => {
    if (isActionLoading) return;
    try {
      setIsActionLoading(true);
      await onSubmit?.(values, tag, createHelpers());
    } catch (error) {
      console.error("[form-error]:", error);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleErrorWrapper: SubmitErrorHandler<FormValues> = (errors) => {
    console.error("[form-errors]:", errors);
    if (form.formState.isSubmitting || isActionLoading) return;
    onError?.();
  };

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
          isActionLoading,
          handleActionSubmit: handleActionSubmitWrapper,
          fields,
          fieldGroups,
          labels,
          defaultValues,
        } as AutoFormContextValue<TSchemaType>
      }
    >
      <Form {...form}>
        <form
          className={className}
          onSubmit={form.handleSubmit(
            (values) => handleActionSubmitWrapper(undefined, values),
            handleErrorWrapper
          )}
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
  show?: Array<Path<z.infer<TSchemaType>>>;
  hide?: Array<Path<z.infer<TSchemaType>>>;
}

function Content_<TSchemaType extends z.ZodObject<z.ZodRawShape>>({
  className = "",
  renderField,
  show,
  hide,
}: ContentProps_<TSchemaType>) {
  const context = useAutoForm<TSchemaType>();

  const { form, fields: allFields, labels } = context;

  if (show && hide) {
    throw new Error(
      "AutoForm.Content Error: Only one of 'show' or 'hide' can be specified, not both."
    );
  }

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

  // Bind controller/render params to the current form value type
  type FV = z.output<TSchemaType>;
  type BaseParams = Omit<ControllerParams<FV>, "defaultController">;

  const createControllerParams = (
    fieldConfig: FieldConfig,
    fieldName: Path<z.infer<TSchemaType>>
  ): ControllerParams<FV> => {
    const set =
      <N extends Path<z.output<TSchemaType>>>(name: N) =>
      (
        value: PathValue<z.output<TSchemaType>, N>,
        options = { shouldValidate: true as const }
      ) =>
        form.setValue(name, value, options);

    const fieldState = form.getFieldState(fieldName);
    const currentValue = form.watch(fieldName);

    const isDisabled = evaluateConditional(fieldConfig.meta?.disabled, false);
    const isReadOnly = evaluateConditional(fieldConfig.meta?.readonly, false);

    const ui = {
      disabled: isDisabled,
      readOnly: isReadOnly,
    };

    const baseParams: BaseParams = {
      context,
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
      ui,
    };

    const defaultControllerNode = getDefaultController<FV>(fieldConfig.type)(
      baseParams as ControllerParams<FV>
    );

    return {
      ...(baseParams as ControllerParams<FV>),
      defaultController: defaultControllerNode,
    };
  };

  const fieldsToRender: Array<FieldConfig> =
    show && show.length > 0
      ? (show
          .map((k: Path<z.infer<TSchemaType>>) => {
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
      : hide && hide.length > 0
      ? allFields.filter(
          (f) => !hide.includes(f.key as Path<z.infer<TSchemaType>>)
        )
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
            const { key, meta } = fieldConfig;
            const fieldName = key as Path<z.infer<TSchemaType>>;

            const isHidden = evaluateConditional(meta?.hidden, false);
            if (isHidden) return null;

            const defaultRender = () => {
              const params = createControllerParams(fieldConfig, fieldName);
              const defaultController = params.defaultController;

              return (
                <FormField
                  key={key}
                  control={form.control}
                  name={fieldName}
                  render={() => (
                    <FormItem className="w-full !flex flex-col">
                      {fieldConfig.type === "switch" ? (
                        <div className="flex flex-row items-center justify-between space-x-3 py-4">
                          {labels && (
                            <Flex direction={"column"} gap={"1"}>
                              <FormLabel htmlFor={key}>
                                {fieldConfig.label}
                              </FormLabel>
                              {meta?.description && (
                                <Text size="2" color="gray">
                                  {renderRichText(meta.description)}
                                </Text>
                              )}
                            </Flex>
                          )}
                          <FormControl>
                            {meta?.controller
                              ? meta.controller(params)
                              : defaultController}
                          </FormControl>
                        </div>
                      ) : (
                        <>
                          {labels && (
                            <FormLabel htmlFor={key}>
                              {fieldConfig.label}
                            </FormLabel>
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
                                ? meta.controller(params)
                                : defaultController}
                            </FormControl>
                          </ErrorBoundary>
                          {meta?.description && (
                            <Text size="2" color="gray">
                              {renderRichText(meta.description)}
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
              const params = createControllerParams(fieldConfig, fieldName);
              const controllerComponent = meta?.controller
                ? meta.controller<FV>(params)
                : params.defaultController;

              return meta.renderer({
                context,
                fieldConfig,
                meta,
                field: params.field,
                fieldState: params.fieldState,
                formState: params.formState,
                labels,
                controller: controllerComponent,
                defaultRender,
                ui: params.ui,
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
  type?: "submit" | "button";
  tag?: string;
  className?: string;
  children: React.ReactNode;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

function Action_({
  type = "button",
  tag,
  className,
  children,
  onClick,
  ...props
}: ActionProps_) {
  const { handleActionSubmit, isActionLoading, form, defaultValues } =
    useAutoForm<z.ZodObject<z.ZodRawShape>>();

  const isLoading =
    (type === "submit" && form.formState.isSubmitting) || isActionLoading;
  const isDisabled = form.formState.isSubmitting || isActionLoading;

  const handleClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    if (isDisabled) {
      event.preventDefault();
      return;
    }

    if (type === "button" && onClick) {
      onClick(event);
      return;
    }

    if (type === "submit" || tag) {
      event.preventDefault();
      const values = form.getValues();
      const isValid = await form.trigger();

      if (isValid) {
        await handleActionSubmit(tag, values);
      }
    }
  };

  return (
    <Button
      type={type === "submit" ? "submit" : "button"}
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
