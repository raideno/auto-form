import Editor from "@monaco-editor/react";
import { FileType } from "lucide-react";
import { Box, Flex, Heading, Text } from "@radix-ui/themes";

interface CodePreviewProps {
  code: string;
}

export const CodePreview = ({ code }: CodePreviewProps) => {
  return (
    <Box>
      <Flex justify="between" align="center" mb="3">
        <Box>
          <Heading size="4">Editable Schema</Heading>
          <Text size="2" color="gray" mb="3">
            Edit the Zod schema below and see the form update in real-time:
          </Text>
        </Box>
        <Flex gap="2"></Flex>
      </Flex>

      <Box className="bg-[var(--gray-2)] relative overflow-hidden rounded-[max(var(--radius-2),var(--radius-full))] border border-[var(--gray-7)]">
        <pre className="border-b border-b-[var(--gray-7)] p-4 overflow-hidden">
          <code className="text-sm flex flex-row items-center gap-1">
            <FileType color="blue" width={16} height={16} />
            <Text color="blue">app.tsx</Text>{" "}
          </code>
        </pre>

        <Editor
          theme="light"
          options={{
            minimap: { enabled: false },
            lineNumbers: "off",
            glyphMargin: false,
            folding: false,
            lineDecorationsWidth: 0,
            readOnly: true,
          }}
          defaultValue={code}
          language="javascript"
          className="w-full h-80 font-mono text-sm resize-none"
        />
      </Box>
    </Box>
  );
};
