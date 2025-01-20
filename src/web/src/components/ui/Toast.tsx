/***************************************************************************************************
 * Toast.tsx
 * -----------------------------------------------------------------------------------------------
 * A comprehensive Toast notification component that provides accessible, animated notifications
 * with multiple variants (success, error, warning, info, default), queuing system, and extensive
 * customization options. This fulfills:
 *  - User Interface Design: Implements consistent toast notifications (Tailwind + cva + cn).
 *  - Accessibility Requirements: Ensures proper ARIA live regions, keyboard navigation,
 *    screen reader support, and respects user preferences for reduced motion.
 *
 * Imports and third-party library versions:
 *  - React ^18.2.0
 *  - framer-motion ^10.16.4
 *  - class-variance-authority ^0.7.0
 *  - cn (from ../../lib/utils) for conditional class name merging
 *
 * Exports:
 *  1. toastVariants           - A function returning combined class names for styling each toast.
 *  2. Toast                   - A main toast component with enhanced features and accessibility.
 *  3. ToastProvider           - A context provider that manages toast state, positioning, and queue.
 *  4. useToast                - A hook to access toast manipulation functions and context state.
 **************************************************************************************************/

/***************************************************************************************************
 * External Imports (with versions in comments)
 **************************************************************************************************/
import React from 'react'; // react ^18.2.0
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'; // framer-motion ^10.16.4
import { cva } from 'class-variance-authority'; // class-variance-authority ^0.7.0

/***************************************************************************************************
 * Internal Imports
 **************************************************************************************************/
import { cn } from '../../lib/utils'; // Utility for conditional class name construction

/***************************************************************************************************
 * 1. toastVariants
 * -----------------------------------------------------------------------------------------------
 * This function defines comprehensive style variants for different toast types with support for
 * states and interactions. It returns a string of combined class names derived from cva & cn.
 *
 * Steps:
 *  1. Define base styles using Tailwind classes for layout, spacing, and animations.
 *  2. Define semantic color schemes for each variant (success, error, warning, info, default).
 *  3. Include hover and focus states for any interactive elements (like action buttons).
 *  4. Add responsive style adjustments if desired.
 *  5. Include dark mode variants.
 *  6. Combine with optional user-provided className if provided.
 **************************************************************************************************/
type ToastVariantProps = {
  variant: 'default' | 'success' | 'error' | 'warning' | 'info';
  className?: string;
  hasIcon?: boolean;
  hasProgress?: boolean;
};

const toastStyles = cva(
  // Base Tailwind classes for the toast container
  'relative flex items-center gap-3 px-4 py-3 rounded-md shadow-md text-sm ' +
    'transition-colors transition-shadow duration-200 select-none ' +
    'focus:outline-none focus:ring-2 focus:ring-offset-2 ' +
    // Layout & spacing
    'max-w-sm w-full pointer-events-auto ' +
    // Dark mode background fallback
    'dark:bg-neutral-800 dark:text-neutral-50 ',
  {
    variants: {
      variant: {
        default: 'bg-white text-neutral-900 border border-neutral-200',
        success: 'bg-green-50 text-green-800 border border-green-200',
        error: 'bg-red-50 text-red-800 border border-red-200',
        warning: 'bg-yellow-50 text-yellow-800 border border-yellow-200',
        info: 'bg-blue-50 text-blue-800 border border-blue-200',
      },
      hasIcon: {
        true: 'pl-2', // Provide a bit more space on the left if an icon is rendered
        false: '',
      },
      hasProgress: {
        true: 'pb-5', // Additional bottom padding to accommodate progress bar
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      hasIcon: false,
      hasProgress: false,
    },
  }
);

/**
 * toastVariants - Combines the cva-generated class names with any user-supplied className
 *                 for final stylings.
 * @param {ToastVariantProps} props - variant, className, hasIcon, hasProgress
 * @returns {string} Combined Tailwind class names
 */
export function toastVariants({
  variant,
  className,
  hasIcon,
  hasProgress,
}: ToastVariantProps): string {
  // cva returns a single string with the correct Tailwind utility classes
  const combined = toastStyles({ variant, hasIcon, hasProgress });
  // Merge with user-provided className (if any)
  return cn(combined, className);
}

/***************************************************************************************************
 * 2. ToastProps & Internal State
 * -----------------------------------------------------------------------------------------------
 * Parameter definitions for the Toast component, fulfilling the specification:
 * {
 *   variant?: 'default' | 'success' | 'error' | 'warning' | 'info',
 *   title: string,
 *   description?: string,
 *   duration?: number,
 *   onDismiss?: () => void,
 *   className?: string,
 *   icon?: React.ReactNode,
 *   action?: { label: string, onClick: () => void },
 *   hasProgress?: boolean,
 *   soundEnabled?: boolean
 * }
 *
 * Internal property definitions for the Toast's class-based approach:
 *  - defaultDuration : number
 *  - isVisible       : boolean
 *  - remainingTime   : number
 *  - isPaused        : boolean
 **************************************************************************************************/
export interface ToastProps {
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info';
  title: string;
  description?: string;
  duration?: number;
  onDismiss?: () => void;
  className?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  hasProgress?: boolean;
  soundEnabled?: boolean;
}

interface ToastState {
  isVisible: boolean;
  isPaused: boolean;
  remainingTime: number;
}

/***************************************************************************************************
 * 3. Toast - Main Notification Component
 * -----------------------------------------------------------------------------------------------
 * A class-based React component to reflect the specification's constructor and methods:
 *   - Constructor: initializes default duration, sets up progress, configures animation, etc.
 *   - handleDismiss: handles toast cleanup, exit animation, callback invocation.
 *   - handlePause: handles pausing the dismiss timer and updating remaining time.
 *
 * Includes accessibility features:
 *   - role="status" and aria-live="polite" to announce changes to screen readers.
 *   - Optional sound notifications if soundEnabled is set.
 *   - Keyboard event listeners (Escape to dismiss) for improved accessibility.
 *
 * Also respects user preferences for reduced motion, skipping or simplifying animations if needed.
 **************************************************************************************************/
export class Toast extends React.Component<ToastProps, ToastState> {
  // The default duration to be used if none is provided
  defaultDuration: number;
  // The timer ID for auto-dismiss
  private dismissTimer: number | null;
  // The last timestamp used to track how much time remains
  private lastTick: number;
  // For playing an optional sound if requested
  private audioRef: HTMLAudioElement | null;

  constructor(props: ToastProps) {
    super(props);

    /***********************************************************************************************
     * Step-by-step per specification:
     * 1. Initialize default duration and visibility state
     * 2. Set up progress tracking if enabled
     * 3. Configure animation preferences based on user settings
     * 4. Initialize sound notification if enabled
     * 5. Set up keyboard event listeners
     * 6. Configure auto-dismiss timer with pause capability
     ***********************************************************************************************/

    // 1. Initialize default duration and visibility
    this.defaultDuration = this.props.duration ?? 5000;
    this.state = {
      isVisible: true,
      isPaused: false,
      remainingTime: this.defaultDuration,
    };

    // 2. We'll track progress by updating 'remainingTime' and eventually dismissing
    this.dismissTimer = null;
    this.lastTick = Date.now();

    // 4. Initialize sound notification if requested
    this.audioRef = null;
    if (this.props.soundEnabled) {
      // For demonstration, no actual file is loaded here
      // In a real app, you might set this to a beep or chime .mp3
      this.audioRef = new Audio();
    }

    // 5. Keyboard event listener for Escape key to dismiss
    this.handleKeyDown = this.handleKeyDown.bind(this);

    // Bind methods
    this.handleDismiss = this.handleDismiss.bind(this);
    this.handlePause = this.handlePause.bind(this);
  }

  /**
   * Lifecycle method: componentDidMount
   *  - Here we trigger auto-dismiss if a duration is specified
   *  - We also add any global keydown listeners
   */
  componentDidMount(): void {
    document.addEventListener('keydown', this.handleKeyDown);

    // If the user wants auto-dismiss, set up the timer
    if (this.defaultDuration > 0) {
      this.startDismissTimer();
    }

    // If sound is enabled, play a short notification beep
    if (this.audioRef) {
      // In a real app, handle playback with user permissions
      void this.audioRef.play().catch(() => {
        // If playback fails (browsers blocking auto-play?), fallback gracefully
      });
    }
  }

  /**
   * Lifecycle method: componentWillUnmount
   *  - Cleanup event listeners and any running timers
   */
  componentWillUnmount(): void {
    document.removeEventListener('keydown', this.handleKeyDown);
    this.clearDismissTimer();
  }

  /**
   * handleDismiss
   * ---------------------------------------------------------------------------------------------
   * Handles the toast dismissal. Steps from specification:
   *   1. Clear existing dismiss timer
   *   2. Stop progress animation if active
   *   3. Set visibility to false for exit animation
   *   4. Clean up event listeners
   *   5. Call onDismiss callback if provided
   */
  handleDismiss(): void {
    // 1. Clear timer
    this.clearDismissTimer();

    // 2. Stop progress by setting isPaused to true
    this.setState({ isPaused: true });

    // 3. Hide the toast (exit animation)
    this.setState({ isVisible: false }, () => {
      // 4. Clean up after animation completes
      setTimeout(() => {
        // 5. onDismiss callback
        if (this.props.onDismiss) {
          this.props.onDismiss();
        }
      }, 200); // short delay to let exit animations run
    });
  }

  /**
   * handlePause
   * ---------------------------------------------------------------------------------------------
   * Handles pausing the toast dismiss timer, typically on hover/focus or user action.
   * Steps from specification:
   *   1. Pause dismiss timer
   *   2. Stop progress animation
   *   3. Update remaining time
   *   4. Set pause state
   */
  handlePause(): void {
    // 1. Pause the timer
    this.clearDismissTimer();

    // 2. We set isPaused to true
    // 3. Update remainingTime in the process
    const currentTs = Date.now();
    const elapsed = currentTs - this.lastTick;
    this.setState((prev) => ({
      isPaused: true,
      remainingTime: prev.remainingTime - elapsed,
    }));
  }

  /**
   * handleKeyDown
   * ---------------------------------------------------------------------------------------------
   * Triggered on any keydown event. If user presses Escape while focused anywhere,
   * dismiss the toast for improved accessibility.
   */
  private handleKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      this.handleDismiss();
    }
  }

  /**
   * startDismissTimer
   * ---------------------------------------------------------------------------------------------
   * Internal helper that starts or restarts the dismiss countdown.
   * We measure time in intervals so that if the user hovered/in or out, we can
   * precisely track how much time remains.
   */
  private startDismissTimer(): void {
    this.lastTick = Date.now();
    this.dismissTimer = window.setInterval(() => {
      const now = Date.now();
      const delta = now - this.lastTick;
      this.lastTick = now;

      this.setState((prev) => {
        const updatedRemaining = prev.remainingTime - delta;
        if (updatedRemaining <= 0) {
          // Dismiss
          clearInterval(this.dismissTimer!);
          this.dismissTimer = null;
          this.handleDismiss();
          return { remainingTime: 0, isPaused: false };
        }
        return { remainingTime: updatedRemaining };
      });
    }, 100);
  }

  /**
   * clearDismissTimer
   * ---------------------------------------------------------------------------------------------
   * Clears the existing interval-based timer, if any.
   */
  private clearDismissTimer(): void {
    if (this.dismissTimer !== null) {
      clearInterval(this.dismissTimer);
      this.dismissTimer = null;
    }
  }

  /**
   * handleResume
   * ---------------------------------------------------------------------------------------------
   * If the user moves away from hover, or the toast regains focus, we can resume the countdown
   * from wherever it left off.
   */
  private handleResume(): void {
    if (this.state.isPaused && this.state.remainingTime > 0) {
      this.setState({ isPaused: false }, () => {
        this.startDismissTimer();
      });
    }
  }

  /**
   * render
   * ---------------------------------------------------------------------------------------------
   * Renders the toast with motion animations. Includes:
   *  - role="status"
   *  - aria-live="polite"
   *  - an optional icon
   *  - a title and optional description
   *  - optional progress bar
   *  - optional action button
   */
  render(): React.ReactNode {
    const {
      variant = 'default',
      title,
      description,
      icon,
      action,
      className,
      hasProgress,
    } = this.props;

    // Merge classes using cva + user-provided className
    const toastClass = toastVariants({
      variant,
      hasIcon: !!icon,
      hasProgress: !!hasProgress,
      className,
    });

    /***********************************************************************************************
     * Manage reducedMotion preference for initial/exit animations
     **********************************************************************************************/
    const prefersReducedMotion = useReducedMotion();

    // Framer Motion settings for fade/slide from the right
    const variants = {
      hidden: { opacity: 0, x: 50 },
      visible: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: 50 },
    };

    // Calculate progress factor for an optional progress bar
    let progressRatio = 1;
    if (this.defaultDuration && hasProgress) {
      progressRatio = Math.max(0, this.state.remainingTime / this.defaultDuration);
    }

    if (!this.state.isVisible) {
      // Return null so it gracefully exits when isVisible is set to false
      return null;
    }

    return (
      <motion.div
        initial={prefersReducedMotion ? false : 'hidden'}
        animate="visible"
        exit={prefersReducedMotion ? false : 'exit'}
        variants={variants}
        transition={{ duration: 0.2 }}
        role="status"
        aria-live="polite"
        onMouseEnter={() => this.handlePause()}
        onMouseLeave={() => this.handleResume()}
        onFocus={() => this.handlePause()}
        onBlur={() => this.handleResume()}
        className={toastClass}
      >
        {/* Optional icon rendering */}
        {icon && (
          <div className="flex-shrink-0">
            {icon}
          </div>
        )}

        {/* Title and description */}
        <div className="flex flex-col flex-grow">
          <span className="font-medium leading-snug">
            {title}
          </span>
          {description && (
            <span className="text-sm text-neutral-700 dark:text-neutral-200 mt-1">
              {description}
            </span>
          )}

          {/* Optional action button */}
          {action && (
            <button
              type="button"
              onClick={action.onClick}
              className="mt-2 text-blue-700 dark:text-blue-300 underline hover:no-underline"
            >
              {action.label}
            </button>
          )}
        </div>

        {/* Optional close/dismiss button */}
        <button
          type="button"
          onClick={this.handleDismiss}
          className="ml-auto text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
          aria-label="Dismiss notification"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Optional progress bar */}
        {hasProgress && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-neutral-200 dark:bg-neutral-600">
            <div
              className="h-full bg-blue-500 transition-all duration-100 ease-linear"
              style={{ width: `${progressRatio * 100}%` }}
            />
          </div>
        )}
      </motion.div>
    );
  }
}

/***************************************************************************************************
 * 4. ToastContext and ToastProvider
 * -----------------------------------------------------------------------------------------------
 * The Enhanced context provider for managing toast state, positioning, and queue. It addresses:
 * { children: React.ReactNode, maxToasts?: number, position?: 'top-right' | 'top-left' |
 *   'bottom-right' | 'bottom-left', groupSimilar?: boolean }
 *
 * Steps for addToast:
 *  1. Generate unique ID for the toast
 *  2. Check for similar existing toasts if grouping enabled
 *  3. Manage toast queue size limits
 *  4. Add toast to queue with correct positioning
 *  5. Handle toast lifecycle and cleanup
 *  6. Manage focus and accessibility announcements
 **************************************************************************************************/
interface InternalToastItem extends ToastProps {
  id: string;
}

type ToastContextType = {
  toasts: InternalToastItem[];
  addToast: (toast: ToastProps) => void;
  removeToast: (id: string) => void;
};

export interface ToastProviderProps {
  children: React.ReactNode;
  maxToasts?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  groupSimilar?: boolean;
}

const ToastContext = React.createContext<ToastContextType | null>(null);

/**
 * useToast
 * -----------------------------------------------------------------------------------------------
 * A convenience hook giving access to toast manipulation functions and the toasts array.
 */
export function useToast(): ToastContextType {
  const ctx = React.useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider.');
  }
  return ctx;
}

/**
 * ToastProvider
 * ------------------------------------------------------------------------------
 * Implements the queue logic, storing toasts in state, limiting queue size, and
 * grouping similar toasts if enabled. Renders them in the specified position.
 */
export function ToastProvider({
  children,
  maxToasts = 5,
  position = 'top-right',
  groupSimilar = false,
}: ToastProviderProps) {
  const [toasts, setToasts] = React.useState<InternalToastItem[]>([]);

  /**
   * removeToast
   * --------------------------------------------------------------------------
   * Removes a toast from state by its unique ID.
   */
  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  /**
   * addToast
   * --------------------------------------------------------------------------
   * Steps:
   *  1. Generate a unique ID for the new toast.
   *  2. If groupSimilar is true, check if a toast with the same title, variant,
   *     and description exists. If so, skip or update that existing toast.
   *  3. Enforce the maxToasts limit by removing the oldest if needed.
   *  4. Add the new toast to the queue.
   *  5. Lifecycle handling is done inside the Toast component and removeToast.
   *  6. Manage optional focus and ARIA announcements, but for simplicity,
   *     rely on aria-live regions inside each Toast.
   */
  const addToast = React.useCallback(
    (toast: ToastProps) => {
      const newId = `toast_${Date.now()}_${Math.random().toString(36).substring(2)}`;
      const newToast: InternalToastItem = { ...toast, id: newId };

      setToasts((prev) => {
        // 2. Grouping logic
        if (groupSimilar && toast.title) {
          const matchIndex = prev.findIndex(
            (existing) =>
              existing.title === toast.title &&
              existing.variant === toast.variant &&
              existing.description === toast.description
          );
          if (matchIndex !== -1) {
            // Already have a similar toast, skip or re-insert
            return prev;
          }
        }

        // 3. Manage queue size (remove earliest if over limit)
        if (prev.length >= maxToasts) {
          // Remove the first toast in the array
          const sliced = prev.slice(1);
          return [...sliced, newToast];
        }

        // 4. Add new one to the queue
        return [...prev, newToast];
      });
    },
    [groupSimilar, maxToasts]
  );

  // Provide the final context value
  const contextValue = React.useMemo(
    () => ({
      toasts,
      addToast,
      removeToast,
    }),
    [toasts, addToast, removeToast]
  );

  /**
   * positionStyles
   * --------------------------------------------------------------------------
   * Basic absolute/fixed positioning styles for toasts container. We wrap the
   * toast list in a fixed element so it floats above the main UI.
   */
  const positionStyles = React.useMemo(() => {
    let base = 'fixed flex flex-col p-4 space-y-3 z-50 ';
    switch (position) {
      case 'top-left':
        return cn(base, 'top-0 left-0 items-start');
      case 'top-right':
        return cn(base, 'top-0 right-0 items-end');
      case 'bottom-left':
        return cn(base, 'bottom-0 left-0 items-start');
      case 'bottom-right':
      default:
        return cn(base, 'bottom-0 right-0 items-end');
    }
  }, [position]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}

      {/* Portal area for toasts, rendered via AnimatePresence for transitions */}
      <div className={positionStyles} role="region" aria-label="Toast Notifications">
        <AnimatePresence>
          {toasts.map((item) => (
            <ToastWrapper
              key={item.id}
              item={item}
              remove={() => removeToast(item.id)}
            />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

/***************************************************************************************************
 * 5. ToastWrapper - Connects the Toast component to Provider State
 * -----------------------------------------------------------------------------------------------
 * We use a small wrapper for the actual Toast rendering, so that when the toast is dismissed
 * internally, we can remove it from the provider state. This avoids direct props drilling
 * of removeToast or onDismiss from the user side.
 **************************************************************************************************/
function ToastWrapper({
  item,
  remove,
}: {
  item: InternalToastItem;
  remove: () => void;
}) {
  const {
    id,
    variant,
    title,
    description,
    duration,
    onDismiss,
    className,
    icon,
    action,
    hasProgress,
    soundEnabled,
  } = item;

  // Intercept the onDismiss call to remove from provider state
  const handleDismiss = () => {
    if (onDismiss) onDismiss();
    remove();
  };

  return (
    <Toast
      key={id}
      variant={variant}
      title={title}
      description={description}
      duration={duration}
      onDismiss={handleDismiss}
      className={className}
      icon={icon}
      action={action}
      hasProgress={hasProgress}
      soundEnabled={soundEnabled}
    />
  );
}