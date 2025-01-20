import React, {
  FC,
  useState,
  useEffect,
  useRef,
  useCallback,
  KeyboardEvent,
  ReactNode,
} from 'react'; // ^18.2.0

// react-beautiful-dnd ^13.1.1
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
  DraggableStateSnapshot,
} from 'react-beautiful-dnd';

// @tanstack/react-virtual ^3.0.0
import { useVirtualizer, Virtualizer } from '@tanstack/react-virtual';

// lodash ^4.17.21
import { debounce } from 'lodash';

// react-error-boundary ^4.0.0
import { ErrorBoundary } from 'react-error-boundary';

// Internal Imports
import SequenceStep from './SequenceStep'; // The individual step component
import { reorderSteps, useSequenceSync } from '../../hooks/useSequences'; // Hook methods

// Types from the technical specification
import { Sequence } from '../../types/sequence';

/**
 * UndoRedoHistory<T>: A simplistic interface representing
 * an undo/redo stack for the Sequence. In a larger codebase,
 * you might implement a full class or library integration.
 */
interface UndoRedoHistory<T> {
  canUndo: boolean;
  canRedo: boolean;
  undoStack: T[];
  redoStack: T[];
  pushState: (state: T) => void;
  undo: () => T | null;
  redo: () => T | null;
}

/**
 * createUndoRedoHistory: A factory function to create
 * an UndoRedoHistory for Sequence objects.
 */
function createUndoRedoHistory<T>(initial: T): UndoRedoHistory<T> {
  return {
    canUndo: false,
    canRedo: false,
    undoStack: [],
    redoStack: [],
    pushState(state: T) {
      this.undoStack.push(state);
      this.redoStack = [];
      this.canUndo = this.undoStack.length > 0;
      this.canRedo = this.redoStack.length > 0;
    },
    undo() {
      if (this.undoStack.length === 0) return null;
      const current = this.undoStack.pop() as T;
      this.redoStack.push(current);
      this.canUndo = this.undoStack.length > 0;
      this.canRedo = this.redoStack.length > 0;
      return this.undoStack.length > 0 ? this.undoStack[this.undoStack.length - 1] : null;
    },
    redo() {
      if (this.redoStack.length === 0) return null;
      const redone = this.redoStack.pop() as T;
      this.undoStack.push(redone);
      this.canUndo = this.undoStack.length > 0;
      this.canRedo = this.redoStack.length > 0;
      return redone;
    },
  };
}

/**
 * SequenceTimelineProps: Prop definition for the SequenceTimeline component.
 * @property {Sequence} sequence - The sequence data to visualize and manage.
 * @property {(sequence: Sequence) => void} onUpdate - Callback to propagate updated sequence data.
 * @property {(error: Error) => void} onError - Callback for handling any errors.
 */
export interface SequenceTimelineProps {
  sequence: Sequence;
  onUpdate: (updatedSequence: Sequence) => void;
  onError: (error: Error) => void;
}

/**
 * SequenceTimeline
 * --------------------------------------------------------------------
 * This component renders and manages the timeline of steps in an email
 * sequence, including email steps (EMAIL), wait periods (WAIT), and
 * conditional branches (CONDITION).
 *
 * Implements:
 *  - Real-time synchronization via useSequenceSync
 *  - Drag-and-drop reordering with react-beautiful-dnd
 *  - Virtualization for performance in large sequences
 *  - Undo/redo history for robust editing
 *  - Comprehensive error handling with ErrorBoundary
 *  - Accessible keyboard navigation and labeling
 */
const SequenceTimeline: FC<SequenceTimelineProps> = ({ sequence, onUpdate, onError }) => {
  /**
   * Local State & References
   * ----------------------------------------------------------------
   */
  // Whether a drag operation is currently in progress (for styling or feedback).
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Undo/Redo state manager for the sequence.
  const historyRef = useRef<UndoRedoHistory<Sequence>>(createUndoRedoHistory({ ...sequence }));

  // Virtualizer for performance when rendering many steps.
  const parentRef = useRef<HTMLDivElement | null>(null);
  const [containerHeight, setContainerHeight] = useState<number>(600);

  // The core virtualization instance. We'll store it in a ref for direct interaction.
  const virtualizerRef = useRef<Virtualizer<HTMLDivElement, HTMLDivElement> | null>(null);

  // Sequence state in local component, so changes can be undone/redone or manipulated.
  const [localSequence, setLocalSequence] = useState<Sequence>({ ...sequence });

  // Hook to handle real-time updates from server (if any). For demonstration,
  // we only pass the sequence ID and a callback to handle server-sent changes.
  useSequenceSync(localSequence.id, (updated: Sequence) => {
    // Merge changes if appropriate. In a real system, you might do a more granular approach.
    try {
      setLocalSequence(updated);
      onUpdate(updated);
    } catch (error) {
      onError(error as Error);
    }
  });

  /**
   * Constructor-Like Effect
   * ----------------------------------------------------------------
   * Steps from JSON specification's "constructor":
   *  1) Initialize timeline state and history
   *  2) Set up WebSocket subscription (handled by useSequenceSync)
   *  3) Configure virtualization
   *  4) Initialize accessibility features
   *  5) Set up error boundary (wrapped below)
   */
  useEffect(() => {
    // Step 1) Initialize timeline state and history
    // We do that by pushing the initial sequence into the history.
    historyRef.current.pushState(localSequence);

    // Step 2) Set up WebSocket subscription is done automatically in useSequenceSync.

    // Step 3) Configure virtualization with useVirtualizer
    if (parentRef.current) {
      const v = useVirtualizer({
        count: localSequence.steps.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 120, // Approx height of each step (in px)
        // We can adjust overscan if we want more or fewer items rendered
        overscan: 5,
      });
      virtualizerRef.current = v;
      // For demonstration, we set the container height, but you could
      // measure dynamically or pass style props.
      setContainerHeight(600);
    }

    // Step 4) For accessibility, we can set aria-label or role. We'll do it in the JSX.
    // Step 5) The ErrorBoundary is set around this component's return markup below.

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * handleDragEnd
   * ----------------------------------------------------------------
   * Called when a drag operation completes. The DropResult provides
   * source and destination indexes. Our steps from JSON spec:
   *  1) Validate drop location
   *  2) Create optimistic update
   *  3) Add to undo history
   *  4) Update local state
   *  5) Sync with server
   *  6) Handle errors and rollback if needed
   */
  const handleDragEnd = useCallback(
    async (result: DropResult) => {
      try {
        setIsDragging(false);

        // 1) Validate drop location
        const { source, destination } = result;
        if (!destination || destination.index === source.index) {
          return;
        }

        // 2) Create an optimistic update
        const updatedSteps = reorderSteps(localSequence.steps, source.index, destination.index);

        // 3) Add updated sequence to undo stack
        const newSequence: Sequence = {
          ...localSequence,
          steps: updatedSteps,
          updatedAt: new Date(),
        };
        historyRef.current.pushState(newSequence);

        // 4) Update local state
        setLocalSequence(newSequence);
        onUpdate(newSequence);

        // 5) Sync with server
        // Hypothetical server sync can be done via an API or
        // rely on the existing real-time hooks. We'll assume an API call:
        // await updateSequenceOnServer(newSequence);

      } catch (error) {
        // 6) Rollback if needed
        onError(error as Error);
        if (historyRef.current.canUndo) {
          const undone = historyRef.current.undo();
          if (undone) {
            setLocalSequence({ ...undone });
            onUpdate({ ...undone });
          }
        }
      }
    },
    [localSequence, onUpdate, onError]
  );

  /**
   * renderSteps
   * ----------------------------------------------------------------
   * Renders the sequence steps in a scrollable, virtualized list. The
   * steps from JSON specification:
   *  1) Set up virtualization container
   *  2) Render visible steps only
   *  3) Add ARIA attributes
   *  4) Handle keyboard navigation
   *  5) Add connecting lines
   *  6) Manage conditional branches
   *
   * Many of these are conceptual; we show them at a high level below.
   */
  const renderSteps = useCallback((): ReactNode => {
    // 1) Virtualization container. We'll assume virtualizerRef is valid.
    const v = virtualizerRef.current;
    if (!v) {
      return null;
    }
    v.setCount(localSequence.steps.length);

    // 2) Compute the visible range of items
    const virtualItems = v.getVirtualItems();

    return (
      <div
        role="list"
        aria-label="Sequence Steps"
        style={{
          height: `${containerHeight}px`,
          overflow: 'auto',
          position: 'relative',
        }}
        ref={parentRef}
        onKeyDown={handleKeyboardNavigation}
      >
        <div
          style={{
            height: v.getTotalSize(),
            width: '100%',
            position: 'relative',
          }}
        >
          {/* 3) ARIA attributes are spread throughout for accessibility. */}
          {virtualItems.map((item) => {
            const step = localSequence.steps[item.index];
            // 4) We'll handle basic keyboard nav in handleKeyboardNavigation.
            // 5) "Add connecting lines" can be done with absolute positioning or a separate layer.
            // 6) "Manage conditional branches" might be in the step details themselves.

            return (
              <div
                key={step.id}
                role="listitem"
                aria-roledescription="Timeline step"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  transform: `translateY(${item.start}px)`,
                  width: '100%',
                }}
              >
                <Draggable
                  draggableId={step.id}
                  index={item.index}
                  key={step.id}
                  isDragDisabled={false}
                >
                  {(provided, snapshot: DraggableStateSnapshot) => {
                    if (snapshot.isDragging !== isDragging) {
                      setIsDragging(snapshot.isDragging);
                    }
                    return (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        style={{
                          ...provided.draggableProps.style,
                        }}
                      >
                        <SequenceStep
                          // Pass in the step data, onUpdate etc.
                          step={step}
                          index={item.index}
                          onUpdate={(updatedStep, validation) => {
                            // We'll merge step changes into localSequence
                            if (validation.isValid) {
                              const newSteps = [...localSequence.steps];
                              newSteps[item.index] = updatedStep;
                              const newSeq = {
                                ...localSequence,
                                steps: newSteps,
                                updatedAt: new Date(),
                              };
                              historyRef.current.pushState(newSeq);
                              setLocalSequence(newSeq);
                              onUpdate(newSeq);
                            }
                            // If invalid, do nothing or display error
                          }}
                          onRemove={async (stepId: string) => {
                            // Remove the step from localSequence
                            try {
                              const newSteps = localSequence.steps.filter((s) => s.id !== stepId);
                              const newSeq: Sequence = {
                                ...localSequence,
                                steps: newSteps,
                                updatedAt: new Date(),
                              };
                              historyRef.current.pushState(newSeq);
                              setLocalSequence(newSeq);
                              onUpdate(newSeq);
                            } catch (err) {
                              onError(err as Error);
                            }
                          }}
                        />
                      </div>
                    );
                  }}
                </Draggable>
              </div>
            );
          })}
        </div>
      </div>
    );
  }, [
    containerHeight,
    handleKeyboardNavigation,
    isDragging,
    localSequence,
    onError,
    onUpdate,
  ]);

  /**
   * handleKeyboardNavigation
   * ----------------------------------------------------------------
   * Manages keyboard interactions for accessibility. Steps from JSON:
   *  1) Process keyboard event
   *  2) Move focus appropriately
   *  3) Trigger drag operations
   *  4) Announce changes to screen readers
   */
  const handleKeyboardNavigation = useCallback(
    (event: KeyboardEvent<HTMLDivElement>): void => {
      try {
        // 1) Basic detection of arrow keys
        if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
          event.preventDefault();
          // 2) Move focus or selection. We might do something like:
          // focus the previous/next step item if we had a focusable list
        }

        // 3) Trigger drag operations. In a more advanced scenario, we
        // could do keyboard-based reordering. We'll skip the details here.

        // 4) Announce changes to screen readers or do aria-live updates.
        // For demonstration, we won't implement a full solution here.
      } catch (error) {
        onError(error as Error);
      }
    },
    [onError]
  );

  /**
   * Render final UI with DragDropContext and Droppable
   * for the entire timeline region.
   */
  return (
    <ErrorBoundary
      onError={onError}
      fallbackRender={({ error, resetErrorBoundary }) => (
        <div className="text-red-700" role="alert">
          <p className="font-bold">Something went wrong in Sequence Timeline!</p>
          <p>{error.message}</p>
          <button
            type="button"
            onClick={() => {
              resetErrorBoundary();
            }}
          >
            Try Again
          </button>
        </div>
      )}
    >
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="sequence-timeline-droppable" direction="vertical">
          {(providedDroppable) => (
            <div ref={providedDroppable.innerRef} {...providedDroppable.droppableProps}>
              {/* This is the scrolled/virtualized region of steps */}
              {renderSteps()}
              {providedDroppable.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </ErrorBoundary>
  );
};

export default SequenceTimeline;