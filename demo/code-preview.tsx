import Editor from "@monaco-editor/react";

import { z } from "zod/v4";
import { FileType } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { Box, Button, Flex, Heading, Text } from "@radix-ui/themes";

import { MetadataRegistry } from "../src/components/auto-form/registry";

interface CodePreviewProps {
  defaultCode: string;
  onSchemaChange: (schema: z.ZodObject<z.ZodRawShape>) => void;
}

export const CodePreview = ({
  defaultCode,
  onSchemaChange,
}: CodePreviewProps) => {
  const [code, setCode] = useState<string | undefined>(() => {
    return defaultCode;
  });

  const [error, setError] = useState<string | null>(null);

  const validateAndUpdateSchema = useCallback(
    (codeString: string) => {
      try {
        const schemaFunction = new Function(
          "z_",
          "MetadataRegistry",
          `return ${codeString}`
        );
        const newSchema = schemaFunction(z, MetadataRegistry);

        if (newSchema && typeof newSchema.parse === "function") {
          onSchemaChange(newSchema);
          setError(null);
        } else {
          setError("Invalid schema: Result is not a Zod schema");
        }
      } catch (err) {
        setError(
          `Schema error: ${
            err instanceof Error ? err.message : "Unknown error"
          }`
        );
      }
    },
    [onSchemaChange]
  );

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
  };

  const applyChanges = () => {
    validateAndUpdateSchema(code || "");
  };

  const resetToDefault = () => {
    setCode(defaultCode);
    validateAndUpdateSchema(defaultCode);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      validateAndUpdateSchema(code || "");
    }, 1000);

    return () => clearTimeout(timer);
  }, [code, validateAndUpdateSchema]);

  return (
    <Box>
      <Flex justify="between" align="center" mb="3">
        <Box>
          <Heading size="4">Editable Schema</Heading>
          <Text size="2" color="gray" mb="3">
            Edit the Zod schema below and see the form update in real-time:
          </Text>
        </Box>
        <Flex gap="2">
          <Button variant="soft" size="2" onClick={applyChanges}>
            Apply Changes
          </Button>
          <Button variant="outline" size="2" onClick={resetToDefault}>
            Reset
          </Button>
        </Flex>
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
          }}
          value={code}
          language="javascript"
          onChange={(value) => handleCodeChange(value || "")}
          className="w-full h-80 p-4 border-l border-r border-b border-gray-200 rounded-b-lg font-mono text-sm resize-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />

        {error && (
          <Box
            mt="2"
            p="3"
            className="bg-red-50 border border-red-200 rounded-lg"
          >
            <Text size="2" color="red">
              <strong>Error:</strong> {error}
            </Text>
          </Box>
        )}

        <Box
          mt="2"
          p="3"
          className="bg-blue-50 border border-blue-200 rounded-lg"
        >
          <Text size="2" color="blue">
            <strong>Tip:</strong> Changes are automatically applied after 1
            second of inactivity. Available: <code>z.string()</code>,{" "}
            <code>z.number()</code>, <code>z.boolean()</code>,
            <code>z.array()</code>, <code>z.object()</code>,{" "}
            <code>z.file()</code>, <code>z.url()</code>, and more. Use{" "}
            <code>.register(MetadataRegistry, options)</code> for custom field
            types.
          </Text>
        </Box>
      </Box>
    </Box>
  );
};
