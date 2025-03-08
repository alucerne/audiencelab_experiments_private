import React from 'react';

import { CaretSortIcon } from '@radix-ui/react-icons';
import { X } from 'lucide-react';
import {
  ActionMeta,
  ClearIndicatorProps,
  DropdownIndicatorProps,
  MultiValue,
  MultiValueRemoveProps,
  NoticeProps,
  OptionProps,
  components,
} from 'react-select';
import AsyncSelect from 'react-select/async';

import { cn } from '@kit/ui/utils';

interface StringOption {
  value: string;
  label: string;
}

const createOption = (str: string) => ({
  value: str,
  label: str,
});

function DropdownIndicator(props: DropdownIndicatorProps<StringOption>) {
  return (
    <components.DropdownIndicator {...props}>
      <CaretSortIcon className="h-4 w-4 opacity-50" />
    </components.DropdownIndicator>
  );
}

function ClearIndicator(props: ClearIndicatorProps<StringOption>) {
  return (
    <components.ClearIndicator
      {...props}
      className="hover:border-destructive hover:bg-destructive/5 hover:text-destructive rounded-md border border-transparent p-0.5 opacity-50 hover:cursor-pointer hover:opacity-100"
    >
      <X className="h-4 w-4" />
    </components.ClearIndicator>
  );
}

function MultiValueRemove(props: MultiValueRemoveProps<StringOption>) {
  return (
    <components.MultiValueRemove {...props}>
      <X className="h-3.5 w-3.5" />
    </components.MultiValueRemove>
  );
}

const NoOptionsMessage = (props: NoticeProps<StringOption>) => (
  <components.NoOptionsMessage {...props}>
    <div className="text-muted-foreground py-0.5 text-sm">{props.children}</div>
  </components.NoOptionsMessage>
);

const LoadingMessage = (props: NoticeProps<StringOption>) => (
  <components.LoadingMessage {...props}>
    <div className="text-accent-foreground py-2 text-sm">Searching...</div>
  </components.LoadingMessage>
);

function Option(props: OptionProps<StringOption>) {
  return (
    <components.Option
      {...props}
      className="relative rounded px-2 py-1.5 hover:cursor-pointer"
    >
      <div className="text-accent-foreground text-sm">{props.label}</div>
    </components.Option>
  );
}

export default function AsyncMultiSelect({
  value,
  onChange,
  className,
  searchAction,
  debounceTime = 300,
}: {
  value: string[];
  onChange: (value: string[]) => void;
  className?: string;
  searchAction: (search: string) => Promise<string[]>;
  debounceTime?: number;
}) {
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  const loadOptions = async (inputValue: string) => {
    if (!inputValue || inputValue.length < 2) {
      return [];
    }
    try {
      const results = await searchAction(inputValue);
      const options = results.map(createOption);
      return options;
    } catch (error) {
      console.error('Error fetching options:', error);
      return [];
    }
  };

  const debouncedLoadOptions = (inputValue: string): Promise<StringOption[]> =>
    new Promise((resolve, reject) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(async () => {
        try {
          const options = await loadOptions(inputValue);
          resolve(options);
        } catch (error) {
          reject(error);
        }
      }, debounceTime);
    });

  function handleChange(
    newValue: MultiValue<StringOption>,
    _: ActionMeta<StringOption>,
  ) {
    onChange(newValue.map((option) => option.value));
  }

  return (
    <AsyncSelect<StringOption, true>
      cacheOptions
      loadOptions={debouncedLoadOptions}
      value={value.map(createOption)}
      onChange={handleChange}
      isMulti
      closeMenuOnSelect={false}
      placeholder="Type to search..."
      noOptionsMessage={({ inputValue }) =>
        inputValue && inputValue.length >= 2
          ? 'No options found'
          : 'Type to search'
      }
      loadingMessage={() => 'Searching...'}
      unstyled
      styles={{
        input: (base) => ({
          ...base,
          'input:focus': { boxShadow: 'none' },
        }),
        menu: (provided) => ({
          ...provided,
          position: 'static',
        }),
        menuPortal: (base) => ({
          ...base,
          zIndex: 9999,
          pointerEvents: 'auto',
        }),
        multiValueLabel: (base) => ({
          ...base,
          whiteSpace: 'normal',
          overflow: 'visible',
        }),
        control: (base) => ({
          ...base,
          transition: 'colors 0.2s',
        }),
      }}
      components={{
        DropdownIndicator,
        ClearIndicator,
        MultiValueRemove,
        Option,
        NoOptionsMessage,
        LoadingMessage,
      }}
      classNames={{
        container: () => cn('w-full', className),
        control: ({ isFocused }) =>
          cn(
            'border-input hover:border-ring/50 flex w-full rounded-md border bg-transparent px-3 py-1 text-base shadow-2xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
            isFocused &&
              'focus-visible:ring-ring focus-visible:ring-1 focus-visible:outline-hidden',
          ),
        placeholder: () => 'text-muted-foreground text-sm',
        input: () => 'text-sm focus-visible:outline-hidden',
        valueContainer: () => 'gap-1.5 flex-wrap',
        singleValue: () => 'leading-7 ml-1 text-foreground',
        multiValue: () =>
          'bg-secondary text-accent-foreground rounded items-center px-1.5 gap-1.5 text-[13px] my-0.5',
        multiValueLabel: () => 'py-0.5',
        multiValueRemove: () =>
          'border border-transparent hover:bg-destructive/5 hover:text-destructive text-muted-foreground border-muted-foreground hover:border-destructive rounded-md',
        indicatorsContainer: () => 'gap-1.5',
        indicatorSeparator: () => 'my-1.5 bg-muted-foreground opacity-50',
        menu: () =>
          'p-1 mt-2 rounded-md border bg-popover text-popover-foreground shadow-xs overflow-hidden animate-in fade-in-0 zoom-in-100',
        groupHeading: () =>
          'py-1.5 px-2 text-sm font-semibold text-accent-foreground',
        option: ({ isFocused, isDisabled }) =>
          cn(
            isFocused && 'bg-secondary',
            isDisabled && 'cursor-not-allowed opacity-50',
          ),
        noOptionsMessage: () => 'text-accent-foreground py-1.5 pr-2 text-sm',
      }}
    />
  );
}
