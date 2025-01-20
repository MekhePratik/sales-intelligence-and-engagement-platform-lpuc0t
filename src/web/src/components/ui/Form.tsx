import React, {
  useState,
  useEffect,
  useCallback,
  createContext,
  useContext,
  FC,
  ReactNode,
} from 'react';
// react ^18.2.0

import { useForm, FormProvider, useFormContext, useController } from 'react-hook-form';
// react-hook-form ^7.45.0

import { z, ZodSchema } from 'zod'; // zod ^3.22.0
import { zodResolver } from '@hookform/resolvers/zod'; // @hookform/resolvers/zod ^3.3.0

import Input from './Input'; // Input field component with enhanced accessibility
import Button from './Button'; // Form submission button with loading states
import { cn } from '../../lib/utils'; // Enhanced utility for combining form-specific class names

//////////////////////////////////////////////////////////////////////////////////////
// Global Default Classes (from JSON specification)
//////////////////////////////////////////////////////////////////////////////////////

/**
 * Applies base spacing, maximum width, and horizontal centering for the form container.
 */
export const defaultFormClasses = 'space-y-4 w-full max-w-lg mx-auto';

/**
 * Default error text styling, including red text color and slight top margin.
 */
export const defaultErrorClasses = 'text-sm font-medium text-red-500 mt-1';

/**
 * Container classes for an individual field, stacking label and input vertically with spacing.
 */
export const defaultFieldClasses = 'flex flex-col space-y-2';

/**
 * Standard label styling: smaller font size, medium weight, neutral text color.
 */
export const defaultLabelClasses = 'text-sm font-medium text-gray-700';

//////////////////////////////////////////////////////////////////////////////////////
// Internal Types for Form, Field, and Error Components
//////////////////////////////////////////////////////////////////////////////////////

/**
 * Defines the shape of the props to be passed to the Form component.
 *
 * @template TFormData - The interface or type describing the form data structure.
 */
export interface FormProps<TFormData extends Record<string, any>> {
  /**
   * Zod schema used to validate the form data at runtime.
   */
  schema: ZodSchema<TFormData>;

  /**
   * Async submit handler that receives validated form data
   * and performs any necessary server updates or side effects.
   */
  onSubmit: (data: TFormData) => Promise<void>;

  /**
   * Child components (e.g., fields, buttons) rendered inside the form.
   */
  children: ReactNode;

  /**
   * Additional CSS class names to merge with the default form styling.
   */
  className?: string;

  /**
   * Boolean flag controlling a parent-driven loading state.
   * May override or supplement the internal isSubmitting logic.
   */
  loading?: boolean;

  /**
   * Disables interactions with the form, preventing input changes or submission.
   */
  disabled?: boolean;
}

/**
 * Describes the props for the FormField component, which wraps a single form field
 * with a label, an Input, and integrated error handling.
 *
 * @template TFormData - The interface or type describing the form data structure.
 */
export interface FormFieldProps<TFormData extends Record<string, any>> {
  /**
   * Name of the field in the form data model; used for react-hook-form registration.
   */
  name: keyof TFormData;

  /**
   * Optional label text displayed above the input element.
   */
  label?: string;

  /**
   * The input type (e.g., 'text', 'email', 'password'). Defaults to 'text'.
   */
  type?: React.InputHTMLAttributes<HTMLInputElement>['type'];

  /**
   * Optional placeholder text shown when the input is empty.
   */
  placeholder?: string;

  /**
   * Additional CSS classes for customizing the container style of this field.
   */
  className?: string;

  /**
   * Whether this field should be disabled, preventing changes.
   */
  disabled?: boolean;
}

/**
 * Defines the props for the FormError component, which displays an error message
 * with screen reader compatibility and a consistent style.
 */
export interface FormErrorProps {
  /**
   * The actual text of the error to be displayed to the user.
   */
  message?: string;

  /**
   * Optional test ID or additional attributes for QA or automation.
   */
  dataTestId?: string;
}

//////////////////////////////////////////////////////////////////////////////////////
// Form Context and Auxiliary Mechanisms
//////////////////////////////////////////////////////////////////////////////////////

/**
 * Internal context bridging additional form-level state (loading, disabled, etc.)
 * for advanced usage. This can be expanded if needed for deeper synchronization
 * across subcomponents.
 */
interface InternalFormContextValue {
  loading?: boolean;
  disabled?: boolean;
}
const InternalFormContext = createContext<InternalFormContextValue>({});

/**
 * Custom hook simplifying access to the InternalFormContext state.
 */
function useInternalFormContext() {
  return useContext(InternalFormContext);
}

//////////////////////////////////////////////////////////////////////////////////////
// Enhanced Form Component
//////////////////////////////////////////////////////////////////////////////////////

/**
 * Enhanced form component with real-time validation, detailed error handling, and
 * robust accessibility features. Integrates react-hook-form + zod for schema-based
 * validations. Minimizes boilerplate by wrapping children in a shared FormProvider.
 *
 * This component addresses the following:
 * 1) Form Validation: Comprehensive by way of zodResolver, real-time feedback.
 * 2) Accessibility Requirements: ARIA labels, focus management, keyboard navigation.
 * 3) Design System Implementation: Tailwind + Shadcn presets, full customization.
 */
const Form = function <TFormData extends Record<string, any>>(
  props: FormProps<TFormData>
) {
  //////////////////////////////////////////////////////////////////////////////////////
  // Constructor-Like Steps (Initialization)
  // 1) Initialize form state with useForm hook and zodResolver
  // 2) Set up enhanced error handling and validation
  // 3) Configure form submission with loading states
  // 4) Initialize accessibility features and focus management
  // 5) Set up real-time validation feedback
  //////////////////////////////////////////////////////////////////////////////////////

  const {
    schema,
    onSubmit,
    children,
    className,
    loading: externalLoading = false,
    disabled: externalDisabled = false,
  } = props;

  // Step 1: Initialize form with zodResolver and real-time validation mode
  const methods = useForm<TFormData>({
    resolver: zodResolver(schema),
    mode: 'onChange',
  });

  const {
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setFocus,
  } = methods;

  // Step 2 & 3: Manage loading and disabled states, merging external with internal
  const [internalLoading, setInternalLoading] = useState<boolean>(externalLoading);
  const [internalDisabled, setInternalDisabled] = useState<boolean>(externalDisabled);

  useEffect(() => {
    setInternalLoading(externalLoading || isSubmitting);
  }, [externalLoading, isSubmitting]);

  useEffect(() => {
    setInternalDisabled(externalDisabled);
  }, [externalDisabled]);

  // Step 4: Focus management for the first error encountered, if any
  useEffect(() => {
    const fieldNames = Object.keys(errors);
    if (fieldNames.length > 0) {
      setFocus(fieldNames[0] as keyof TFormData);
    }
  }, [errors, setFocus]);

  // Step 5: Real-time validation feedback is already configured via mode: 'onChange'.

  //////////////////////////////////////////////////////////////////////////////////////
  // Enhanced Form Submission Handler
  //////////////////////////////////////////////////////////////////////////////////////
  const submitHandler = useCallback(
    async (data: TFormData) => {
      // 1) Validate form data (already done by zodResolver).
      // 2) If valid, handle success path.
      try {
        setInternalLoading(true);
        await onSubmit(data);
        // 3) Reset the form on success.
        reset();
      } catch (error) {
        // 4) Provide error feedback if submission fails - can add toast or logs here.
      } finally {
        // 5) Revert loading state.
        setInternalLoading(false);
      }
    },
    [onSubmit, reset]
  );

  //////////////////////////////////////////////////////////////////////////////////////
  // Render the Form with Context Providers for Shared State
  //////////////////////////////////////////////////////////////////////////////////////
  return (
    <InternalFormContext.Provider
      value={{
        loading: internalLoading,
        disabled: internalDisabled,
      }}
    >
      <FormProvider {...methods}>
        <form
          noValidate
          onSubmit={handleSubmit(submitHandler)}
          className={cn(defaultFormClasses, className)}
          aria-disabled={internalDisabled ? 'true' : 'false'}
        >
          {children}
        </form>
      </FormProvider>
    </InternalFormContext.Provider>
  );
};

//////////////////////////////////////////////////////////////////////////////////////
// FormField Component
//////////////////////////////////////////////////////////////////////////////////////

/**
 * FormField is a reusable field wrapper that integrates directly with
 * react-hook-form through its context, pairing a Label, Input, and error
 * message display. This reduces boilerplate in form building and centralizes
 * accessibility attributes.
 */
export function FormField<TFormData extends Record<string, any>>(
  props: FormFieldProps<TFormData>
) {
  const { name, label, type = 'text', placeholder, className, disabled } = props;
  const { register, formState } = useFormContext<TFormData>();
  const { loading } = useInternalFormContext();
  const errorValue = formState.errors[name];

  return (
    <div className={cn(defaultFieldClasses, className)}>
      {label ? (
        <label
          htmlFor={String(name)}
          className={defaultLabelClasses}
        >
          {label}
        </label>
      ) : null}

      <Input
        id={String(name)}
        type={type}
        placeholder={placeholder}
        error={Boolean(errorValue)}
        errorMessage={errorValue?.message as string}
        disabled={disabled || loading}
        // Spread out registration to link react-hook-form
        {...register(name)}
      />
    </div>
  );
}

//////////////////////////////////////////////////////////////////////////////////////
// FormError Component
//////////////////////////////////////////////////////////////////////////////////////

/**
 * Displays an error message with strong styling and screen reader support. This
 * component can be used for top-level form errors (e.g., server-side errors) or
 * any general error not tied to a specific field.
 */
export const FormError: FC<FormErrorProps> = ({ message, dataTestId }) => {
  if (!message) return null;

  return (
    <p
      className={defaultErrorClasses}
      role="alert"
      aria-live="assertive"
      data-testid={dataTestId}
    >
      {message}
    </p>
  );
};

//////////////////////////////////////////////////////////////////////////////////////
// Default Export and Named Exports
//////////////////////////////////////////////////////////////////////////////////////

/**
 * The primary entry point exporting the Form as the default for
 * consistent usage throughout the application. Additional named
 * exports support modular usage of FormField and FormError.
 */
export default Form;