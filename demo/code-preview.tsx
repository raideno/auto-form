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

      <Box className="relative">
        <pre className="bg-gray-50 border border-gray-200 rounded-t-lg p-4 overflow-hidden">
          <code className="text-sm flex flex-row items-center gap-1">
            <FileType width={16} height={16} className="text-blue-600" />
            <span className="text-blue-600">app.tsx</span>{" "}
          </code>
        </pre>

        <Editor
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
          className="w-full h-80 p-4 border-l border-r border-b border-gray-200 rounded-b-lg font-mono text-sm resize-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </Box>
    </Box>
  );
};
