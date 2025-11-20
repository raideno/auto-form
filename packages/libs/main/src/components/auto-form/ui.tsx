import { useEffect, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { Button, Flex, Text } from "@radix-ui/themes";
import { useForm } from "react-hook-form";

import type React from "react";
import type * as z from "zod/v4";
import type { Path, PathValue, SubmitErrorHandler } from "react-hook-form";
import type { ButtonProps } from "@radix-ui/themes";
import type { AutoFormContextValue, FieldConfig } from "./context";

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
