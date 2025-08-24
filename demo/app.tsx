import { FormInput } from "lucide-react";
import { AutoForm } from "../src/components/auto-form/ui";
import { Box, Flex, Heading, Text } from "@radix-ui/themes";

import { cn } from "./lib/utils";
import { CodePreview } from "./code-preview";
import { INITIAL_SCHEMA_CODE, INITIAL_SCHEMA_STRING } from "./schema";

export const App = () => {
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
          <CodePreview code={INITIAL_SCHEMA_STRING} />
          <Box>
            <Heading size="4" mb="3">
              Generated Form
            </Heading>
            <AutoForm.Root
              onError={() => console.log("[error]:")}
              onSubmit={(data) => console.log("[submit]:", data)}
              schema={INITIAL_SCHEMA_CODE}
            >
              <AutoForm.Content />
              <AutoForm.Actions className="mt-4 flex !flex-col w-full gap-2">
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
