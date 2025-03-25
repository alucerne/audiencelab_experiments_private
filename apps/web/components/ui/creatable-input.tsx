'use client';

import React, { KeyboardEventHandler, useState } from 'react';

import { X } from 'lucide-react';
import {
  ClearIndicatorProps,
  MultiValueRemoveProps,
  components,
} from 'react-select';
import CreatableSelect from 'react-select/creatable';

import { cn } from '@kit/ui/utils';

interface StringOption {
  label: string;
  value: string;
}

const createOption = (str: string) => ({
  label: str,
  value: str,
});

const stringsToOptions = (strings: string[]) => strings.map(createOption);

const optionsToStrings = (options: readonly { value: string }[]) =>
  options.map((option) => option.value);

const ClearIndicator = (props: ClearIndicatorProps<StringOption, true>) => {
  return (
    <components.ClearIndicator
      {...props}
      className="hover:border-destructive hover:bg-destructive/5 hover:text-destructive rounded-md border border-transparent p-0.5 opacity-50 hover:cursor-pointer hover:opacity-100"
    >
      <X className="h-4 w-4" />
    </components.ClearIndicator>
  );
};

function MultiValueRemove(props: MultiValueRemoveProps) {
  return (
    <components.MultiValueRemove {...props}>
      <X className="h-3.5 w-3.5" />
    </components.MultiValueRemove>
  );
}

export default function CreatableInput({
  value,
  onChange,
  placeholder = 'Type and press enter...',
  className,
}: {
  value: string[];
  onChange: (newValue: string[]) => void;
  placeholder?: string;
  className?: string;
}) {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown: KeyboardEventHandler = (event) => {
    if (!inputValue) return;

    if (event.key === 'Enter' || event.key === 'Tab') {
      event.preventDefault();
      event.stopPropagation();

      const entries = inputValue
        .split(',')
        .map((entry) => entry.trim())
        .filter((entry) => entry);

      const newValues = [...value];
      for (const entry of entries) {
        if (!newValues.some((v) => v.toLowerCase() === entry.toLowerCase())) {
          newValues.push(entry);
        }
      }
      onChange(newValues);
      setInputValue('');
    }
  };

  return (
    <CreatableSelect
      inputValue={inputValue}
      isClearable
      isMulti
      menuIsOpen={false}
      onChange={(newValue) => onChange(optionsToStrings(newValue || []))}
      onInputChange={(newValue) => setInputValue(newValue)}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      value={stringsToOptions(value)}
      unstyled
      styles={{
        input: (base) => ({
          ...base,
          'input:focus': {
            boxShadow: 'none',
          },
        }),
        multiValueLabel: (base) => ({
          ...base,
          whiteSpace: 'normal',
          overflow: 'visible',
        }),
        control: (base) => ({
          ...base,
          transition: 'none',
        }),
      }}
      components={{
        DropdownIndicator: null,
        ClearIndicator,
        MultiValueRemove,
      }}
      classNames={{
        container: () => cn('w-full', className),
        control: ({ isFocused }) =>
          cn(
            'border-input hover:border-ring/50 flex w-full rounded-md border bg-transparent px-3 py-1 text-base shadow-2xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
            isFocused &&
              'focus-visible:ring-ring focus-visible:ring-1 focus-visible:outline-hidden',
            'hover:cursor-text',
          ),
        placeholder: () => 'text-muted-foreground text-sm',
        input: () => 'text-sm',
        valueContainer: () => 'gap-1.5 flex-wrap',
        singleValue: () => 'leading-7 ml-1',
        multiValue: () =>
          'bg-secondary text-accent-foreground rounded items-center px-1.5 gap-1.5 text-[13px] my-0.5',
        multiValueLabel: () => 'py-0.5',
        multiValueRemove: () =>
          'border border-transparent hover:bg-destructive/5 hover:text-destructive text-muted-foreground border-muted-foreground hover:border-destructive rounded-md',
        indicatorsContainer: () => 'gap-1.5',
        indicatorSeparator: () => 'my-1.5 bg-muted-foreground opacity-50',
        menu: () =>
          'p-1 mt-2 rounded-md border bg-popover text-popover-foreground shadow-md overflow-hidden animate-in fade-in-0 zoom-in-100',
        groupHeading: () =>
          'py-1.5 px-2 text-sm font-semibold text-accent-foreground',
        option: ({ isFocused, isDisabled }) =>
          cn(isFocused && 'bg-secondary', isDisabled && 'opacity-50'),
        noOptionsMessage: () => 'text-accent-foreground py-1.5 pr-2 text-sm',
      }}
    />
  );
}
