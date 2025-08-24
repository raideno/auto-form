/* eslint-disable @typescript-eslint/no-empty-object-type */
/* eslint-disable react-refresh/only-export-components */
import React, { createContext, forwardRef, useContext, useState } from "react";

import { Badge, Box, TextField } from "@radix-ui/themes";

import type { BoxProps } from "@radix-ui/themes";

interface TagInputContextValue {
  tags: Array<string>;
  inputValue: string;
  setInputValue: (value: string) => void;
  addTag: (tag: string) => void;
  removeTag: (index: number) => void;
  onTagsChange?: (tags: Array<string>) => void;
  maxTags?: number;
}

const TagInputContext = createContext<TagInputContextValue | null>(null);

const useTagInputContext = () => {
  const context = useContext(TagInputContext);
  if (!context) {
    throw new Error("TagInput components must be used within TagInput.Root");
  }
  return context;
};

export type TagInputRootProps = BoxProps & {
  value?: Array<string>;
  defaultValue?: Array<string>;
  onValueChange?: (tags: Array<string>) => void;
  maxTags?: number;
  minTags?: number;
  children: React.ReactNode;
};

const TagInputRoot = forwardRef<HTMLDivElement, TagInputRootProps>(
  (
    {
      minTags,
      value,
      defaultValue = [],
      onValueChange,
      maxTags,
      children,
      ...props
    },
    ref
  ) => {
    const [tags, setTags] = useState<Array<string>>(value || defaultValue);
    const [inputValue, setInputValue] = useState("");

    const currentTags = value !== undefined ? value : tags;

    const addTag = (tag: string) => {
      const trimmedTag = tag.trim();
      if (trimmedTag && !currentTags.includes(trimmedTag)) {
        if (maxTags && currentTags.length >= maxTags) {
          return;
        }
        if (minTags && currentTags.length < minTags) {
          return;
        }

        const newTags = [...currentTags, trimmedTag];
        if (value === undefined) {
          setTags(newTags);
        }
        onValueChange?.(newTags);
      }
    };

    const removeTag = (index: number) => {
      const newTags = currentTags.filter((_, i) => i !== index);
      if (value === undefined) {
        setTags(newTags);
      }
      onValueChange?.(newTags);
    };

    const contextValue: TagInputContextValue = {
      tags: currentTags,
      inputValue,
      setInputValue,
      addTag,
      removeTag,
      onTagsChange: onValueChange,
      maxTags,
    };

    return (
      <TagInputContext.Provider value={contextValue}>
        <Box ref={ref} {...props}>
          {children}
        </Box>
      </TagInputContext.Provider>
    );
  }
);

TagInputRoot.displayName = "TagInput.Root";

export interface TagInputInputProps
  extends Omit<TextField.RootProps, "value" | "onChange"> {
  placeholder?: string;
  children?: React.ReactNode;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

const TagInputInput = forwardRef<HTMLInputElement, TagInputInputProps>(
  ({ placeholder = "Add tags...", onKeyDown, children, ...props }, ref) => {
    const { inputValue, setInputValue, addTag, tags, maxTags } =
      useTagInputContext();

    const isMaxReached = maxTags ? tags.length >= maxTags : false;

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === ",") {
        e.preventDefault();
        if (inputValue.trim() && !isMaxReached) {
          addTag(inputValue);
          setInputValue("");
        }
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (inputValue.trim() && !isMaxReached) {
          addTag(inputValue);
          setInputValue("");
        }
      }
      onKeyDown?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      if (value.includes(",") && !isMaxReached) {
        const parts = value.split(",");
        const tagsToAdd = parts.slice(0, -1);
        const remaining = parts[parts.length - 1];

        tagsToAdd.forEach((tag) => {
          if (tag.trim() && (!maxTags || tags.length < maxTags)) {
            addTag(tag.trim());
          }
        });

        setInputValue(remaining);
      } else {
        setInputValue(value);
      }
    };

    const effectivePlaceholder = isMaxReached
      ? `Maximum ${maxTags} tags reached`
      : placeholder;

    return (
      <TextField.Root
        value={inputValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={effectivePlaceholder}
        disabled={isMaxReached}
        {...props}
        ref={ref}
      >
        {children}
      </TextField.Root>
    );
  }
);

TagInputInput.displayName = "TagInput.Input";

export interface TagInputSlotProps extends TextField.SlotProps {}

const TagInputSlot = forwardRef<HTMLDivElement, TagInputSlotProps>(
  (props, ref) => {
    return <TextField.Slot ref={ref} {...props} />;
  }
);

TagInputSlot.displayName = "TagInput.Slot";

export type TagInputTagsProps = BoxProps & {
  onTagRemove?: (tag: string, index: number) => void;
  renderTag?: (tag: string, index: number) => React.ReactNode;
};

const TagInputTags = forwardRef<HTMLDivElement, TagInputTagsProps>(
  ({ onTagRemove, renderTag, ...props }, ref) => {
    const { tags, removeTag } = useTagInputContext();

    const handleRemoveTag = (index: number) => {
      const tag = tags[index];
      onTagRemove?.(tag, index);
      removeTag(index);
    };

    const defaultRenderTag = (tag: string, index: number) => (
      <Badge
        size={"3"}
        key={index}
        variant="soft"
        style={{
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
        }}
        onClick={() => handleRemoveTag(index)}
      >
        {tag}
        <span style={{ marginLeft: "4px", fontSize: "12px" }}>×</span>
      </Badge>
    );

    if (tags.length === 0) {
      return null;
    }

    return (
      <Box
        ref={ref}
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "4px",
          ...props.style,
        }}
        {...props}
      >
        {tags.map((tag, index) =>
          renderTag ? renderTag(tag, index) : defaultRenderTag(tag, index)
        )}
      </Box>
    );
  }
);

TagInputTags.displayName = "TagInput.Tags";

const TagInputContent = TagInputTags;

TagInputContent.displayName = "TagInput.Content";

export const TagInput = {
  Root: TagInputRoot,
  Input: TagInputInput,
  Slot: TagInputSlot,
  Tags: TagInputTags,
  Content: TagInputContent,
};
