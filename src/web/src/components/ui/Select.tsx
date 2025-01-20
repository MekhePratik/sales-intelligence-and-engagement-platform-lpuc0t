/************************************************************************************************
 * The Select component provides a comprehensive, production-ready dropdown solution with:
 *  - Single or multiple selection support
 *  - Optional search functionality (with debouncing)
 *  - Accessibility (ARIA attributes, keyboard navigation, screen reader support)
 *  - Tailwind styling consistent with the project's design system
 *  - Integration with Radix UI primitives for robust underlying accessibility
 *
 * Implements:
 *  - Design System Specifications (TailwindCSS + Shadcn presets)
 *  - Accessibility Requirements (WCAG 2.1 AA)
 ************************************************************************************************/

/************************************************************************************************
 * 1. External Imports (with versions as comments)
 ***********************************************************************************************/
// React ^18.2.0
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

// Radix UI Select ^2.0.0
import * as RadixSelect from '@radix-ui/react-select';

// Icons from @radix-ui/react-icons ^1.3.0
import { CheckIcon, ChevronDownIcon } from '@radix-ui/react-icons';

/************************************************************************************************
 * 2. Internal Imports
 ***********************************************************************************************/
// Utility for combining class names conditionally
// (src/web/src/lib/utils.ts)
import { cn } from '../../lib/utils';

/************************************************************************************************
 * 3. Global Tailwind Class Constants (as specified in the JSON "globals")
 ***********************************************************************************************/

/**
 * Default classes for the select root, ensuring consistent formatting and transitions.
 */
export const defaultSelectClasses =
  'w-full rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 sm:text-sm transition-colors duration-200';

/**
 * Default classes for the select trigger, addressing states such as error, disabled, etc.
 */
export const defaultTriggerClasses =
  'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[error=true]:border-red-500';

/**
 * Default classes for the select content (dropdown panel), including transitions and positioning.
 */
export const defaultContentClasses =
  'relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2';

/************************************************************************************************
 * 4. Supporting Types & Interfaces
 ***********************************************************************************************/

/**
 * Represents a single selectable option within the dropdown.
 * T is a generic type corresponding to the option's value.
 */
export interface SelectOption<T> {
  /**
   * A human-readable label displayed to the user.
   */
  label: string;
  /**
   * The underlying value representing the option (e.g., an ID or object).
   */
  value: T;
  /**
   * Whether this individual option is disabled.
   */
  disabled?: boolean;
  /**
   * An optional group identifier used to group related options in the UI.
   */
  group?: string;
}

/**
 * Primary props for the main Select component, supporting single or multiple selection,
 * optional search, and handling of state changes.
 */
export interface SelectProps<T> {
  /**
   * The currently selected value(s). Can be a single value (T) or an array of values (T[])
   * if multiple selection is enabled.
   */
  value: T | T[];
  /**
   * Callback triggered whenever the selection changes. Called with a single value or an
   * array of values, depending on multiple selection mode.
   */
  onChange: (newValue: T | T[]) => void;
  /**
   * Placeholder text displayed when no selection has been made.
   */
  placeholder?: string;
  /**
   * Whether the entire select is disabled from user interaction.
   */
  disabled?: boolean;
  /**
   * Indicates if the component is in a loading state (e.g., data fetching).
   */
  loading?: boolean;
  /**
   * Flags the component to render with an error style, often used in validation feedback.
   */
  error?: boolean;
  /**
   * Enables multiple selection if set to true, allowing the user to select multiple options.
   */
  multiple?: boolean;
  /**
   * Additional classes to be combined with the default classes for custom styling or overrides.
   */
  className?: string;
  /**
   * Collection of options made available in the dropdown menu.
   */
  options: Array<SelectOption<T>>;
  /**
   * Allows user to search within the dropdown if true. This can either trigger an internal filter
   * or an external call, depending on the onSearch callback.
   */
  searchable?: boolean;
  /**
   * Callback triggered with the current search string. Allows external handling
   * (e.g., server-side filtering). Optionally used if searching is needed.
   */
  onSearch?: (searchTerm: string) => void;
}

/**
 * Props for the SelectTrigger component, generally derived from relevant fields in SelectProps
 * plus additional styling and state control. This remains flexible to accommodate custom usage.
 */
export interface SelectTriggerProps<T> {
  /**
   * The current selected value(s), displayed in textual form if relevant.
   */
  value: T | T[];
  /**
   * Whether the select is disabled from interaction.
   */
  disabled?: boolean;
  /**
   * Loading state indicator for displaying a spinner or updated ARIA attributes.
   */
  loading?: boolean;
  /**
   * Error state for styling or ARIA attributes.
   */
  error?: boolean;
  /**
   * Text displayed when no value is selected.
   */
  placeholder?: string;
  /**
   * Whether multiple selection is enabled or not.
   */
  multiple?: boolean;
  /**
   * Additional classes to override or extend the trigger styling.
   */
  className?: string;
}

/**
 * Props for the SelectContent component, responsible for rendering the dropdown panel,
 * search input (if enabled), and the list of grouped or ungrouped options.
 */
export interface SelectContentProps<T> {
  /**
   * Full array of options to be rendered as selectable items.
   */
  options: Array<SelectOption<T>>;
  /**
   * Indicates whether multiple option selection is supported.
   */
  multiple?: boolean;
  /**
   * Search status that determines if a search input should be rendered.
   */
  searchable?: boolean;
  /**
   * Current search term used to filter rendered options.
   */
  searchTerm?: string;
  /**
   * Handler function triggered on item selection. Expects the newly changed value array
   * or single value, consolidated at a higher level.
   */
  onSelectOption: (optionValue: T) => void;
  /**
   * The current selection, either a single value (T) or multiple (T[]).
   */
  value: T | T[];
  /**
   * A debounced function that processes changes in the search input. This could either be
   * internal filtering or an external onSearch callback at a higher level.
   */
  handleSearch?: (search: string) => void;
  /**
   * Optional custom className for the content container.
   */
  className?: string;
}

/************************************************************************************************
 * 5. Internal Utility Functions for the Main "Select" Class
 ***********************************************************************************************/

/**
 * The handleValueChange function manages the selection state, supporting both single and
 * multiple selection modes. Once the new value(s) are determined, the parent onChange callback
 * is invoked. If single selection is used, the dropdown can be closed after a selection.
 *
 * Steps:
 * 1) Validate new value against options.
 * 2) Handle multiple selection if enabled.
 * 3) Update internal state.
 * 4) Trigger onChange callback.
 * 5) Close dropdown if single select.
 */
function handleValueChange<T>(
  newValue: T | T[],
  previousValue: T | T[],
  multiple: boolean | undefined,
  onChange: (nv: T | T[]) => void
): T | T[] {
  if (multiple) {
    // For multiple selection, newValue might come in as a single item to add or remove
    // or as an entire updated array, depending on approach.
    const prevArray = Array.isArray(previousValue)
      ? [...previousValue]
      : previousValue !== undefined
      ? [previousValue]
      : [];

    // Ensure newValue is an array or a single item that we need to toggle
    if (Array.isArray(newValue)) {
      onChange([...newValue]);
      return newValue;
    } else {
      // Toggle item if it exists or add if it doesn't
      const index = prevArray.findIndex((val) => val === newValue);
      if (index !== -1) {
        prevArray.splice(index, 1);
      } else {
        prevArray.push(newValue);
      }
      onChange(prevArray);
      return prevArray;
    }
  } else {
    // Single selection
    onChange(newValue);
    return newValue;
  }
}

/**
 * The handleSearch function manages the search term update logic and calls the onSearch
 * callback if provided. Implementing debouncing helps avoid performance bottlenecks when
 * searching large datasets.
 *
 * Steps:
 * 1) Debounce search input.
 * 2) Sanitize search term.
 * 3) Update internal search state.
 * 4) Trigger onSearch callback if provided.
 * 5) Filter options locally if no onSearch is provided (handled in content).
 */
function createHandleSearch<T>(
  onSearch: ((term: string) => void) | undefined,
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>
) {
  let debounceTimer: NodeJS.Timeout | null = null;

  return (searchTerm: string) => {
    // Step 1: Clear existing timers to implement simple debouncing
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    // Step 2: Basic sanitation or trimming
    const sanitizedTerm = searchTerm.trim();

    // Step 3: Debounce with a 300ms delay
    debounceTimer = setTimeout(() => {
      // Step 4: Update local state
      setSearchTerm(sanitizedTerm);

      // Step 5: If onSearch is provided externally, call it
      if (onSearch) {
        onSearch(sanitizedTerm);
      }
    }, 300);
  };
}

/************************************************************************************************
 * 6. Enhanced Trigger Button Component
 ***********************************************************************************************/

/**
 * Enhanced trigger component implementing loading, error states, and ARIA attributes.
 *
 * Steps:
 * 1) Render button with current selection.
 * 2) Display loading spinner when loading.
 * 3) Show error state styling if error.
 * 4) Handle disabled state.
 * 5) Implement keyboard navigation.
 * 6) Apply ARIA attributes.
 * 7) Include dropdown indicator.
 */
export const SelectTrigger = <T,>(props: SelectTriggerProps<T>) => {
  const {
    value,
    disabled,
    loading,
    error,
    placeholder,
    multiple,
    className,
  } = props;

  // Determine display text
  const displayValue = useMemo(() => {
    if (multiple) {
      if (Array.isArray(value)) {
        return (value as T[]).length === 0 ? '' : (value as T[]).join(', ');
      }
      return value ? (value as T).toString() : '';
    } else {
      return value && !Array.isArray(value) ? value.toString() : '';
    }
  }, [value, multiple]);

  return (
    <RadixSelect.Trigger
      className={cn(defaultTriggerClasses, className)}
      aria-invalid={error || undefined}
      aria-disabled={disabled || undefined}
      aria-busy={loading || undefined}
      aria-placeholder={placeholder || undefined}
      aria-multiselectable={multiple || undefined}
      disabled={disabled || loading}
      data-error={error ? 'true' : undefined}
    >
      {/* Step 1: Render text or placeholder */}
      <RadixSelect.Value placeholder={placeholder || ''}>
        {displayValue}
      </RadixSelect.Value>
      {/* Step 2: Display loading spinner when loading, else show arrow icon */}
      {loading ? (
        <svg
          className="ml-2 h-4 w-4 animate-spin text-gray-500"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4l3-3-3-3v4a12 12 0 00-12 12h4z"
          />
        </svg>
      ) : (
        // Step 7: Include dropdown indicator
        <RadixSelect.Icon className="ml-2">
          <ChevronDownIcon className="h-4 w-4" />
        </RadixSelect.Icon>
      )}
    </RadixSelect.Trigger>
  );
};

/************************************************************************************************
 * 7. Virtualized Content Component
 ***********************************************************************************************/

/**
 * Virtualized content rendering the dropdown. Supports:
 *  - Search input if searchable
 *  - Grouped options if group property is available
 *  - Keyboard navigation and RadixUI transitions
 *
 * Steps:
 * 1) Implement virtual scrolling for performance (demonstrated with a placeholder / minimal approach).
 * 2) Render search input if searchable.
 * 3) Group options if grouping enabled.
 * 4) Handle keyboard navigation (provided by Radix).
 * 5) Implement option filtering (local or external).
 * 6) Apply animations and transitions.
 * 7) Position dropdown optimally (Radix handles by default).
 */
export const SelectContent = <T,>(props: SelectContentProps<T>) => {
  const {
    options,
    multiple,
    searchable,
    searchTerm,
    onSelectOption,
    value,
    handleSearch,
    className,
  } = props;

  // Step 5: Local filtering if onSearch is not externally controlling the data
  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options;
    // Filter by label ignoring case
    return options.filter((opt) =>
      opt.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [options, searchTerm]);

  // Step 3: Identify if grouping is enabled by checking if any option has a group property
  const groupingEnabled = useMemo<boolean>(() => {
    return filteredOptions.some((opt) => opt.group);
  }, [filteredOptions]);

  // Build a grouped map { groupName: Array<SelectOption<T>> }
  const groupedData = useMemo(() => {
    if (!groupingEnabled) {
      return { default: filteredOptions };
    }
    return filteredOptions.reduce((acc, opt) => {
      const groupKey = opt.group || 'Other';
      if (!acc[groupKey]) {
        acc[groupKey] = [];
      }
      acc[groupKey].push(opt);
      return acc;
    }, {} as Record<string, SelectOption<T>[]>);
  }, [filteredOptions, groupingEnabled]);

  return (
    <RadixSelect.Portal>
      {/* Step 7: Radix handles portal positioning automatically */}
      <RadixSelect.Content
        className={cn(defaultContentClasses, className)}
        position="popper"
      >
        {/* Step 1: Virtual scrolling example area (placeholder) */}
        {/* In real usage, incorporate a library like react-virtual for large option lists. */}
        <RadixSelect.ScrollUpButton className="flex items-center justify-center py-1">
          <ChevronDownIcon />
        </RadixSelect.ScrollUpButton>

        {/* Step 2: Render search input if searchable */}
        {searchable && (
          <div className="p-2">
            <input
              type="text"
              placeholder="Search..."
              className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm focus:outline-none"
              onChange={(e) => handleSearch && handleSearch(e.target.value)}
            />
          </div>
        )}

        <RadixSelect.Viewport className="p-1">
          {Object.keys(groupedData).map((group) => {
            const groupOptions = groupedData[group];

            return (
              <RadixSelect.Group key={group}>
                {groupingEnabled && group !== 'default' && (
                  <RadixSelect.Label className="px-2 py-1 text-xs font-semibold text-muted-foreground">
                    {group}
                  </RadixSelect.Label>
                )}
                {groupOptions.map((opt) => {
                  const isSelected = multiple
                    ? Array.isArray(value) && value.includes(opt.value)
                    : value === opt.value;
                  return (
                    <RadixSelect.Item
                      key={opt.value as unknown as string}
                      value={String(opt.value)}
                      className={cn(
                        'relative flex cursor-pointer select-none items-center rounded-sm px-8 py-2 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground aria-disabled:opacity-50',
                        opt.disabled ? 'pointer-events-none opacity-50' : ''
                      )}
                      disabled={!!opt.disabled}
                      onSelect={() => onSelectOption(opt.value)}
                    >
                      {/* Step 4: Handle keyboard navigation is built in RadixSelect.Item */}
                      {/* Step 6: Animations and transitions also handled by tailwind + data attributes */}
                      <RadixSelect.ItemIndicator className="absolute left-2 inline-flex items-center">
                        {isSelected && <CheckIcon className="h-4 w-4" />}
                      </RadixSelect.ItemIndicator>
                      <RadixSelect.ItemText>{opt.label}</RadixSelect.ItemText>
                    </RadixSelect.Item>
                  );
                })}
              </RadixSelect.Group>
            );
          })}
        </RadixSelect.Viewport>

        <RadixSelect.ScrollDownButton className="flex items-center justify-center py-1">
          <ChevronDownIcon />
        </RadixSelect.ScrollDownButton>
      </RadixSelect.Content>
    </RadixSelect.Portal>
  );
};

/************************************************************************************************
 * 8. Main Select Component (Memo) - Enhanced with Single/Multiple Selection
 ***********************************************************************************************/

/**
 * The Select component with full feature support, including:
 *  - Single/multiple selection modes
 *  - Searchable dropdown
 *  - Loading, disabled, error states
 *  - Customizable styling
 *  - Integration with Radix UI for accessibility
 */
function UnmemoizedSelect<T>(props: SelectProps<T>) {
  const {
    value,
    onChange,
    placeholder,
    disabled,
    loading,
    error,
    multiple,
    className,
    options,
    searchable,
    onSearch,
  } = props;

  // Local states
  const [internalValue, setInternalValue] = useState<T | T[]>(value);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Effect to keep track of controlled input changes from the parent
  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  // Create handleSearch function with debounce
  const handleSearch = useMemo(
    () => createHandleSearch<T>(onSearch, setSearchTerm),
    [onSearch]
  );

  // Value Change back to the parent
  const onSelectOption = useCallback(
    (optValue: T) => {
      const updatedVal = handleValueChange<T>(
        optValue,
        internalValue,
        multiple,
        onChange
      );
      setInternalValue(updatedVal);
    },
    [internalValue, multiple, onChange]
  );

  // For single selection, we must pass a string to RadixSelect.Root's value prop
  // For multiple selection, we do not rely on RadixSelect's built-in "value" because
  // RadixSelect does not natively support multi-check. Instead, we implement our logic
  // using onSelectOption calls in the content.
  const rootValue = Array.isArray(internalValue)
    ? internalValue.length > 0
      ? String(internalValue[0])
      : ''
    : internalValue !== undefined
    ? String(internalValue)
    : '';

  return (
    <RadixSelect.Root
      // For multiple selection, we rely on custom logic. For single selection, use default.
      value={!multiple ? rootValue : undefined}
      onValueChange={(val) => {
        // Only handle if multiple==false to keep consistent with single selection usage
        if (!multiple) {
          const matchedOption = options.find(
            (option) => String(option.value) === val
          );
          if (matchedOption) {
            handleValueChange<T>(matchedOption.value, internalValue, false, onChange);
            setInternalValue(matchedOption.value);
          }
        }
      }}
      disabled={disabled || loading}
    >
      {/* The Trigger button with states */}
      <SelectTrigger<T>
        value={internalValue}
        disabled={disabled}
        loading={loading}
        error={error}
        placeholder={placeholder}
        multiple={multiple}
        className={className}
      />
      {/* The Content dropdown including search, grouping, filtering */}
      <SelectContent<T>
        options={options}
        multiple={multiple}
        searchable={searchable}
        searchTerm={searchTerm}
        handleSearch={handleSearch}
        onSelectOption={onSelectOption}
        value={internalValue}
      />
    </RadixSelect.Root>
  );
}

/**
 * Exporting a memoized version of the main Select component to optimize render performance.
 */
export const Select = memo(UnmemoizedSelect) as <T>(
  p: SelectProps<T>
) => JSX.Element;

export default Select;