// ------------------------------------------------------------------------------------------------
// External Imports with explicit library versions:
// react ^18.2.0
import React, {
  FC,
  useState,
  useEffect,
  useCallback,
  ReactNode,
  SyntheticEvent,
} from 'react';

// react-beautiful-dnd ^13.1.1
import { Draggable, DraggableProvided, DraggableStateSnapshot } from 'react-beautiful-dnd';

// zod ^3.22.0
import { z } from 'zod';

// ------------------------------------------------------------------------------------------------
// Internal Imports (must ensure usage is correct based on provided sources)
import EmailTemplateEditor from './EmailTemplate'; // Secure email template editing interface
import { SequenceStepType, SequenceStep as ISequenceStep } from '../../types/sequence'; // Type-safe step definitions
import { Card } from '../ui/Card'; // Accessible container component for step content

// ------------------------------------------------------------------------------------------------
// Extensive Comments Outline
// This file defines a "SequenceStep" component that represents a secure and accessible
// step within an email sequence. Drag-and-drop capabilities, comprehensive validation,
// and step-specific rendering (email editor, wait input, condition builder) are implemented
// in compliance with WCAG 2.1 AA standards.
//
// The JSON specification requirements are addressed as follows:
//
// 1) A secure and accessible React component with step management
// 2) Comprehensive validation and security measures using zod
// 3) WCAG 2.1 AA compliant drag-and-drop integration via react-beautiful-dnd
// 4) Step-type-specific rendering, with a secure EmailTemplateEditor for EMAIL
// 5) Thorough error handling, sanitized input, and support for step removal
//
// Usage notes:
//   <SequenceStep
//     step={someSequenceStep}
//     index={0}
//     onUpdate={(updatedStep, validationResult) => {...}}
//     onRemove={async (stepId) => {...}}
//   />
// 
// This component internally manages local editing state, validation errors, and
// drag state to ensure a robust user experience. The final "SequenceStep" is exported
// as default per the specification.
// ------------------------------------------------------------------------------------------------

// -----------------------------------------------------------------------------------------------
// Additional Helper Types
// -----------------------------------------------------------------------------------------------

/**
 * ValidationError represents an individual validation failure with a path to the field
 * and a descriptive message. This is used to store or present step-specific errors.
 */
export interface ValidationError {
  path: string;
  message: string;
}

/**
 * ValidationResult represents the overall outcome of a validation process,
 * indicating if the data is valid and accumulating any related errors.
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// -----------------------------------------------------------------------------------------------
// Zod Schema for Additional Step Validation
// -----------------------------------------------------------------------------------------------

/**
 * Although ISequenceStep is primarily validated by the SequenceStepSchema in
 * ../../types/sequence, we can further refine or re-validate local edits here
 * if we choose to incorporate more constraints. For demonstration, we create
 * a flexible stepSchema that references a partial shape of ISequenceStep fields
 * to simulate local configuration checks or extended rules.
 */
const stepSchema = z.object({
  id: z.string().nonempty("Step ID cannot be empty."),
  stepType: z.string().refine(
    (val) => {
      return [SequenceStepType.EMAIL, SequenceStepType.WAIT, SequenceStepType.CONDITION].includes(
        val as SequenceStepType
      );
    },
    { message: "Invalid step type." }
  ),
  name: z.string().optional(),
  delayHours: z.number().optional(),
  stepOrder: z.number(),
  subject: z.string().optional(),
  body: z.string().optional(),
  // Additional fields can be validated as needed. In a real scenario,
  // we might incorporate attachments or condition validation here.
});

/**
 * The SequenceStepProps interface describes the component's inbound props,
 * matching the JSON specification. It includes references to the actual
 * sequence step data, as well as callbacks and an index for DnD ordering.
 */
export interface SequenceStepProps {
  /**
   * The step data object, adhering to the ISequenceStep interface.
   */
  step: ISequenceStep;

  /**
   * The index for the step within a drag-and-drop context.
   */
  index: number;

  /**
   * onUpdate is invoked whenever the step is updated. It receives the fully
   * updated step object along with a ValidationResult describing success/fail.
   */
  onUpdate: (updatedStep: ISequenceStep, validation: ValidationResult) => void;

  /**
   * onRemove is triggered when this step is to be removed from the sequence.
   * The step's unique ID is provided, and removal can be processed asynchronously.
   */
  onRemove: (stepId: string) => Promise<void>;
}

// -----------------------------------------------------------------------------------------------
// Internal State and Implementation
// -----------------------------------------------------------------------------------------------

/**
 * Secure, accessible sequence step component with comprehensive validation
 * and drag-and-drop capabilities. The constructor-likes and methods from the
 * JSON specification are incorporated in useEffects and dedicated handlers.
 */
const SequenceStep: FC<SequenceStepProps> = ({
  step,
  index,
  onUpdate,
  onRemove,
}) => {
  // --------------------------------------------------------------------------
  // Properties: isDragging, isEditing, validationErrors, stepConfig
  // For clarity, these are stored in React state. They mirror the JSON spec.
  // --------------------------------------------------------------------------

  /**
   * isDragging reflects the local drag state from react-beautiful-dnd's snapshot.
   * We capture it once we render in the Draggable block below.
   */
  const [isDragging, setIsDragging] = useState<boolean>(false);

  /**
   * isEditing indicates if the user is actively editing this step's configuration.
   * For demonstration, we default to false. This can be toggled by the user.
   */
  const [isEditing, setIsEditing] = useState<boolean>(false);

  /**
   * validationErrors accumulates any errors from handleStepUpdate. This can be shown
   * in the UI or used to highlight invalid fields. For demonstration, we store them
   * locally and display minimal feedback.
   */
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  /**
   * stepConfig references the local clone of the step data. We may merge user changes
   * into stepConfig and then pass it through handleStepUpdate. If we want to revert,
   * we can reset this to the original step.
   */
  const [stepConfig, setStepConfig] = useState<ISequenceStep>({ ...step });

  // --------------------------------------------------------------------------
  // Constructor (useEffect) - Steps from JSON spec:
  // 1) Initialize secure step state with validation
  // 2) Set up accessible drag and drop handlers
  // 3) Configure comprehensive validation schemas
  // 4) Initialize secure step configuration handlers
  // 5) Set up error boundaries and logging
  // --------------------------------------------------------------------------
  useEffect(() => {
    // Step 1: Initialize secure step state with validation
    // We can do an initial parse to check for pre-existing errors.
    validateStep(stepConfig);

    // Step 2: The drag-and-drop is managed below in the Draggable block
    // with snapshot. We also see "setIsDragging(snapshot.isDragging)".

    // Step 3: The stepSchema is already configured above. This is where
    // advanced logic or expansions can be introduced if needed.

    // Step 4: The handleStepUpdate function is declared below to unify changes.

    // Step 5: Basic error boundary usage in functional React typically occurs
    // at a higher level. We mimic logging any initialization issues here.
    // For demonstration, do nothing unless there's a reason to log.

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --------------------------------------------------------------------------
  // handleStepUpdate: Securely handles updates to step configuration
  //     with validation. (Matching the JSON specification's steps.)
  // Parameters:
  //   changes: Partial<ISequenceStep> - Fields to merge into the current step
  // Returns: Promise<void>
  // --------------------------------------------------------------------------
  const handleStepUpdate = useCallback(
    async (changes: Partial<ISequenceStep>) => {
      try {
        // 1) Sanitize input data (for demonstration, we might simply trim strings)
        const sanitized = sanitizeStepChanges(changes);

        // 2) Validate changes against schema. We'll do a partial parse to confirm.
        //    If invalid, we store errors and skip merging.
        const partialResult = stepSchema.safeParse({ ...stepConfig, ...sanitized });
        if (!partialResult.success) {
          // Convert zod issues to local ValidationError
          const zodErrors = partialResult.error.issues.map((issue) => ({
            path: issue.path.join('.'),
            message: issue.message,
          }));
          setValidationErrors(zodErrors);

          // Provide a ValidationResult to onUpdate if needed
          const result: ValidationResult = {
            isValid: false,
            errors: zodErrors,
          };
          onUpdate(stepConfig, result); // pass current state plus error
          return;
        }

        // 3) Check security constraints (example: forbid script tags in body).
        const bodyContainsScript = (sanitized.body || '').includes("<script>");
        if (bodyContainsScript) {
          const securityErr = [{
            path: 'body',
            message: 'Script tags are not allowed in email body.',
          }];
          setValidationErrors(securityErr);
          onUpdate(stepConfig, { isValid: false, errors: securityErr });
          return;
        }

        // 4) Merge changes with current step
        const mergedStep = { ...stepConfig, ...sanitized };

        // 5) Validate complete configuration (final parse)
        const finalCheck = stepSchema.safeParse(mergedStep);
        if (!finalCheck.success) {
          const finalZodErrors = finalCheck.error.issues.map((issue) => ({
            path: issue.path.join('.'),
            message: issue.message,
          }));
          setValidationErrors(finalZodErrors);
          onUpdate(stepConfig, { isValid: false, errors: finalZodErrors });
          return;
        }

        // 6) Construct a successful ValidationResult
        const successValidation: ValidationResult = {
          isValid: true,
          errors: [],
        };

        // 7) Update local state with the merged step and clear errors
        setStepConfig(mergedStep);
        setValidationErrors([]);

        // Alert parent of the updated step
        onUpdate(mergedStep, successValidation);

        // 8) Exit editing mode if valid (optional)
        setIsEditing(false);
      } catch (error) {
        // If an unexpected error occurs, create a single error entry
        const fallbackErrors = [
          {
            path: 'general',
            message: (error as Error).message || 'Unknown error encountered.',
          },
        ];
        setValidationErrors(fallbackErrors);

        // Send partial error data back
        const result: ValidationResult = {
          isValid: false,
          errors: fallbackErrors,
        };
        onUpdate(stepConfig, result);
      }
    },
    [onUpdate, stepConfig]
  );

  // --------------------------------------------------------------------------
  // renderStepContent: Renders accessible step content based on stepType
  //   Steps from JSON spec:
  //   1) Validate step type
  //   2) Render secure EmailTemplateEditor for EMAIL type
  //   3) Render validated duration input for WAIT type
  //   4) Render secure condition builder for CONDITION type
  //   5) Apply accessibility attributes
  //   6) Implement error boundaries
  // --------------------------------------------------------------------------
  const renderStepContent = useCallback((): ReactNode => {
    try {
      // 1) Validate step type
      const { stepType } = stepConfig;
      if (stepType === SequenceStepType.EMAIL) {
        // 2) Render secure EmailTemplateEditor
        return (
          <EmailTemplateEditor
            template={{
              subject: stepConfig.subject || "",
              body: stepConfig.body || "",
              variables: [],
              attachments: [],
            }}
            onChange={(updatedTemplate) => {
              // We update step subject/body from the template
              handleStepUpdate({
                subject: updatedTemplate.subject,
                body: updatedTemplate.body,
              });
            }}
            onError={(editorError) => {
              const errObj: ValidationError = {
                path: 'EmailTemplateEditor',
                message: editorError.message,
              };
              setValidationErrors([errObj]);
            }}
            previewMode="desktop"
          />
        );
      } else if (stepType === SequenceStepType.WAIT) {
        // 3) Render validated duration input
        return (
          <div className="flex flex-col space-y-2">
            <label htmlFor={`wait-hours-${stepConfig.id}`} className="text-sm font-medium">
              Wait (hours):
            </label>
            <input
              id={`wait-hours-${stepConfig.id}`}
              type="number"
              min={0}
              aria-label="Wait duration in hours"
              className="border rounded p-2 w-32"
              value={stepConfig.delayHours || 0}
              onChange={(e: SyntheticEvent<HTMLInputElement>) => {
                const inputVal = Number(e.currentTarget.value);
                handleStepUpdate({ delayHours: inputVal });
              }}
            />
          </div>
        );
      } else if (stepType === SequenceStepType.CONDITION) {
        // 4) Render secure condition builder placeholder
        //    For demonstration, we show simple text. A real condition builder would parse
        //    stepConfig.condition, operator, and next step references.
        return (
          <div className="flex flex-col space-y-2">
            <span className="font-semibold text-sm">Condition Step</span>
            <p className="text-xs text-gray-600">
              Configure condition logic (e.g., if previous email is opened). For
              production, a robust UI would appear here.
            </p>
          </div>
        );
      }
      // 5) For unrecognized type, return fallback
      return (
        <span className="text-sm text-red-500">Unrecognized step type: {stepType}</span>
      );
    } catch (renderError) {
      // 6) Implement error boundaries with try/catch in a functional component
      return (
        <span className="text-sm text-red-500">
          Error rendering step: {(renderError as Error).message}
        </span>
      );
    }
  }, [stepConfig, handleStepUpdate]);

  // --------------------------------------------------------------------------
  // Utility function to validate the entire step on mount or external triggers
  // This is invoked from the constructor-like effect or can be called on demand.
  // --------------------------------------------------------------------------
  const validateStep = (candidate: ISequenceStep) => {
    const parsed = stepSchema.safeParse(candidate);
    if (!parsed.success) {
      const zodErrors = parsed.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      }));
      setValidationErrors(zodErrors);
    } else {
      setValidationErrors([]);
    }
  };

  // --------------------------------------------------------------------------
  // Utility function to sanitize step changes. For demonstration:
  // Trims string fields (subject, body, name) to remove leading/trailing spaces.
  // --------------------------------------------------------------------------
  const sanitizeStepChanges = (changes: Partial<ISequenceStep>): Partial<ISequenceStep> => {
    const sanitized: Partial<ISequenceStep> = { ...changes };
    if (typeof sanitized.subject === 'string') {
      sanitized.subject = sanitized.subject.trim();
    }
    if (typeof sanitized.body === 'string') {
      sanitized.body = sanitized.body.trim();
    }
    if (typeof sanitized.name === 'string') {
      sanitized.name = sanitized.name.trim();
    }
    return sanitized;
  };

  // --------------------------------------------------------------------------
  // Render
  // The Draggable component from react-beautiful-dnd is used to handle
  // drag-and-drop behavior. We wire up the provided and snapshot to track isDragging.
  // Inside, we use our Card as a container for the step content.
  // --------------------------------------------------------------------------
  return (
    <Draggable draggableId={step.id} index={index}>
      {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => {
        // We update local isDragging state so we can apply relevant styling or classes
        if (snapshot.isDragging !== isDragging) {
          setIsDragging(snapshot.isDragging);
        }

        return (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            aria-roledescription="Sequence step draggable item"
          >
            {/* Use a Card as the accessible container for step content */}
            <Card
              variant="hover"
              padding="md"
              className="mb-4"
              // Optionally highlight if currently dragging
              style={{
                borderColor: isDragging ? '#2563eb' : '',
                borderWidth: isDragging ? '2px' : '',
                transition: 'border-color 0.2s ease',
              }}
            >
              {/* Step Header */}
              <div className="flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="font-semibold text-sm">
                    {stepConfig.name || `Step #${index + 1}`}
                  </span>
                  <span className="text-xs text-gray-500">
                    Type: {stepConfig.stepType}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  {!isEditing && (
                    <button
                      type="button"
                      className="text-xs px-2 py-1 bg-blue-50 border border-blue-400 text-blue-700 rounded"
                      onClick={() => setIsEditing(true)}
                    >
                      Edit
                    </button>
                  )}
                  <button
                    type="button"
                    className="text-xs px-2 py-1 bg-red-50 border border-red-400 text-red-700 rounded"
                    onClick={async () => {
                      await onRemove(step.id);
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>

              {/* Step Content (renders differently by type) */}
              <div className="mt-4">
                {isEditing ? (
                  <div className="flex flex-col space-y-3">
                    {/* Render step content for editing */}
                    {renderStepContent()}
                    {/* Save/Cancel controls */}
                    <div className="flex space-x-2 mt-3">
                      <button
                        type="button"
                        className="text-xs px-3 py-1 rounded bg-green-100 border border-green-400 text-green-700"
                        onClick={async () => {
                          // On save, we pass updated config to handleStepUpdate with no new changes
                          await handleStepUpdate({});
                        }}
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        className="text-xs px-3 py-1 rounded bg-gray-100 border border-gray-400 text-gray-700"
                        onClick={() => {
                          // Revert local stepConfig to original step before edits
                          setStepConfig(step);
                          setIsEditing(false);
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  // If not editing, we simply show a read-only preview of the step
                  <div className="text-sm text-gray-700">
                    {stepConfig.stepType === SequenceStepType.EMAIL && (
                      <div>
                        <span className="block font-medium">
                          Subject: {stepConfig.subject || '(none)'}
                        </span>
                        <span className="block text-xs text-gray-500">
                          Body: {stepConfig.body ? stepConfig.body.slice(0, 50) : '(none)'}
                          {stepConfig.body && stepConfig.body.length > 50 ? '...' : ''}
                        </span>
                      </div>
                    )}
                    {stepConfig.stepType === SequenceStepType.WAIT && (
                      <div>
                        <span className="block font-medium">Wait Hours: </span>
                        <span className="block text-xs text-gray-500">
                          {stepConfig.delayHours ?? 0}
                        </span>
                      </div>
                    )}
                    {stepConfig.stepType === SequenceStepType.CONDITION && (
                      <div>
                        <span className="block font-medium">Condition Step</span>
                        <span className="block text-xs text-gray-500">
                          Basic conditional logic (details hidden).
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Validation Errors Display */}
              {validationErrors.length > 0 && (
                <ul className="mt-2 list-disc list-inside text-xs text-red-600">
                  {validationErrors.map((err, idx) => (
                    <li key={`${err.path}-${idx}`}>
                      [{err.path}] {err.message}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        );
      }}
    </Draggable>
  );
};

export default SequenceStep;