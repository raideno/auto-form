import { z } from "zod/v4";
import { useState } from "react";
import { FormInput } from "lucide-react";
import { Box, Flex, Heading, Text } from "@radix-ui/themes";

import { cn } from "@/lib/utils";

import { AutoForm } from "@/components/auto-form";
import { CodePreview } from "@/components/code-preview";
import { MetadataRegistry } from "@/components/auto-form/registry";

const initialSchema = z.object({
  name: z.string().max(32).min(2),
  avatar: z
    .file()
    .mime("image/gif")
    .min(1)
    .max(1024 * 1024),
  files: z
    .array(
      z
        .file()
        .mime(["image/jpeg", "image/png"])
        .min(1)
        .max(4 * 1024 * 1024)
    )
    .min(2)
    .max(4),
  names: z.array(z.string()).max(8),
  url: z.url(),
  description: z
    .string()
    .register(MetadataRegistry, { type: "textarea", resize: true }),
});

export const App = () => {
  const [currentSchema, setCurrentSchema] =
    useState<z.ZodObject<z.ZodRawShape>>(initialSchema);

  const handleSchemaChange = (newSchema: z.ZodObject<z.ZodRawShape>) => {
    setCurrentSchema(newSchema);
  };

  return (
    <div className="w-screen h-screen">
      <div className="max-w-2xl mx-auto py-16 px-4">
        <Flex className="w-full" direction={"column"} gap={"8"}>
          <Box>
            <Logo className="mb-4" />
            <Heading>Auto Form Generator</Heading>
            <Text>
              Generate forms automatically from Zod schemas with built-in
              validation and customizable field types.
            </Text>
          </Box>
          <CodePreview onSchemaChange={handleSchemaChange} />
          <Box>
            <Heading size="4" mb="3">
              Generated Form
            </Heading>
            <AutoForm.Root
              onError={() => console.log("[error]:")}
              schema={currentSchema}
            >
              <AutoForm.Content />
              <AutoForm.Actions className="pt-4 flex flex-col w-full">
                <AutoForm.Action
                  className="!w-full"
                  variant="soft"
                  type="reset"
                >
                  Cancel
                </AutoForm.Action>
                <AutoForm.Action
                  className="!w-full"
                  variant="classic"
                  type="submit"
                >
                  Create
                </AutoForm.Action>
              </AutoForm.Actions>
            </AutoForm.Root>
          </Box>
        </Flex>
      </div>
    </div>
  );
};

type LogoProps = React.ComponentProps<"div"> & {};

const Logo: React.FC<LogoProps> = ({ className, ...props }) => (
  <div
    aria-hidden
    className={cn(
      "border border-solid border-white bg-linear-to-b rounded-lg relative flex size-9 translate-y-0.5 items-center justify-center from-[var(--accent-6)] to-[var(--accent-9)] shadow-lg shadow-black/20 ring-1 ring-black/10",
      className
    )}
    {...props}
  >
    <FormInput className="mask-b-from-25% size-6 fill-white stroke-white drop-shadow-sm" />
    <FormInput className="absolute inset-0 m-auto size-6 fill-white stroke-white opacity-65 drop-shadow-sm" />
    <div className="z-1 h-4.5 absolute inset-2 m-auto w-px translate-y-px rounded-full bg-black/10"></div>
  </div>
);
