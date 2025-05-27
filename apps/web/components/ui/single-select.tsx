import React from 'react';

import { CaretSortIcon, CheckIcon } from '@radix-ui/react-icons';
import { X } from 'lucide-react';
import Select, {
  ActionMeta,
  ClearIndicatorProps,
  DropdownIndicatorProps,
  OptionProps,
  SingleValue,
  components,
} from 'react-select';

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
      <X className="h-4 min-h-4 w-4 min-w-4" />
    </components.ClearIndicator>
  );
}

function Option({ className: _, ...props }: OptionProps<StringOption>) {
  return (
    <components.Option {...props}>
      <div className="focus:bg-accent focus:text-accent-foreground relative flex w-full cursor-default items-center rounded-sm py-1.5 pr-8 pl-2 text-sm outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
        <div className="text-accent-foreground text-sm">{props.label}</div>
        {props.isSelected && (
          <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
            <CheckIcon className="h-4 min-h-4 w-4 min-w-4" />
          </span>
        )}
      </div>
    </components.Option>
  );
}

export default function SingleSelect({
  options,
  value,
  onChange,
  disabled = false,
  placeholder = 'Select...',
}: {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  function handleChange(
    newValue: SingleValue<StringOption>,
    _: ActionMeta<StringOption>,
  ) {
    onChange(newValue?.value ?? '');
  }

  return (
    <Select<StringOption, false>
      options={options.map(createOption)}
      value={value ? createOption(value) : null}
      onChange={handleChange}
      closeMenuOnSelect={true}
      hideSelectedOptions={false}
      isDisabled={disabled}
      placeholder={placeholder}
      unstyled
      styles={{
        input: (base) => ({
          ...base,
          'input:focus': {
            boxShadow: 'none',
          },
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
        Option,
      }}
      classNames={{
        container: () => 'w-full',
        control: ({ isFocused }) =>
          cn(
            isFocused && 'ring-ring ring-1 outline-none',
            'border-input ring-offset-background rounded-md border bg-transparent px-3 py-1 shadow-sm hover:cursor-text',
          ),
        placeholder: () => 'text-sm text-muted-foreground',
        input: () => 'text-sm',
        valueContainer: () => 'gap-1.5',
        singleValue: () => 'text-sm',
        indicatorsContainer: () => 'gap-1.5',

        menu: () =>
          'p-1 mt-2 rounded-md border bg-popover text-popover-foreground shadow-md overflow-hidden animate-in fade-in-0 zoom-in-100',
        groupHeading: () =>
          'py-1.5 px-2 text-sm font-semibold text-accent-foreground',
        option: ({ isFocused, isDisabled }) =>
          cn(
            isFocused && 'bg-secondary',
            isDisabled && 'opacity-50',
            'rounded-sm',
          ),
        noOptionsMessage: () => 'text-accent-foreground py-1.5 pr-2 text-sm',
      }}
    />
  );
}
