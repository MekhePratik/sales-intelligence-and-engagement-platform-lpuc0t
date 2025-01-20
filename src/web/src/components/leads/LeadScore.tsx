import React from 'react'; // react ^18.2.0
import { cn } from 'class-variance-authority'; // class-variance-authority ^0.7.0
import type { Lead } from '../../types/lead';
import Card from '../ui/Card';

/***************************************************************************************************
 * LeadScoreProps
 * 
 * Defines the property contract for the LeadScore component. 
 *  - lead: A Lead object containing the numeric score property (0-100).
 *  - showDetails: Whether to show additional descriptive text and explanations.
 *  - className: Optional class names for styling overrides.
 *  - isLoading: Flag to indicate loading state for asynchronous updates or data fetches.
 **************************************************************************************************/
interface LeadScoreProps {
  /**
   * The Lead object from which the score will be derived.
   */
  lead: Lead;

  /**
   * Optional flag indicating if detailed explanations or descriptions should be displayed.
   */
  showDetails?: boolean;

  /**
   * Optional additional class names to merge into the outer container for styling.
   */
  className?: string;

  /**
   * Indicates if the score data is in a loading state. When loading, a placeholder or spinner may appear.
   */
  isLoading?: boolean;
}

/***************************************************************************************************
 * scoreRanges, scoreColors, scoreDescriptions
 * 
 * These objects represent the numeric boundaries, associated Tailwind color classes, 
 * and textual explanations for the respective lead score categories.
 **************************************************************************************************/
const scoreRanges = {
  low: '0-39',
  medium: '40-69',
  high: '70-89',
  excellent: '90-100',
};

const scoreColors = {
  low: 'text-red-500 dark:text-red-400',
  medium: 'text-yellow-500 dark:text-yellow-400',
  high: 'text-green-500 dark:text-green-400',
  excellent: 'text-blue-500 dark:text-blue-400',
};

const scoreDescriptions = {
  low: 'Limited engagement potential',
  medium: 'Moderate prospect fit',
  high: 'Strong conversion potential',
  excellent: 'Ideal target prospect',
};

/***************************************************************************************************
 * getScoreCategory
 * 
 * Determines the category label (low, medium, high, excellent) for a given numeric score. 
 * Steps:
 *  1. Validate that the score is between 0 and 100. If invalid, return 'low' by default as a fallback.
 *  2. Compare the score against the predefined numeric ranges in scoreRanges.
 *  3. Return the appropriate label for that score range.
 *  4. Handle out-of-range values gracefully by defaulting to 'low'.
 **************************************************************************************************/
function getScoreCategory(score: number): keyof typeof scoreRanges {
  if (score < 0 || score > 100) {
    return 'low';
  }
  if (score <= 39) {
    return 'low';
  } else if (score <= 69) {
    return 'medium';
  } else if (score <= 89) {
    return 'high';
  } else {
    return 'excellent';
  }
}

/***************************************************************************************************
 * getScoreColor
 * 
 * Returns the appropriate Tailwind color classes based on the score, including dark mode support.
 * Steps:
 *  1. Call getScoreCategory to derive the category label.
 *  2. Map that category label to the color definition in scoreColors.
 *  3. Enhance the color classes with optional hover or focus states if needed.
 *  4. Return the final Tailwind class string to be applied wherever styling is required.
 **************************************************************************************************/
function getScoreColor(score: number): string {
  const category = getScoreCategory(score);
  const baseColor = scoreColors[category];
  // Example of adding hover or focus states; can be extended further as needed:
  const interactiveStateClasses = 'hover:opacity-90 focus:outline-none focus:ring-2';
  return cn(baseColor, interactiveStateClasses);
}

/***************************************************************************************************
 * LeadScore
 * 
 * A component for displaying a lead's score with visual indicators, interactive elements, 
 * and optional tooltips or descriptive text. Incorporates robust accessibility considerations 
 * via ARIA attributes and keyboard interactions.
 * 
 * Constructor-like Setup Steps (functionally executed in the component):
 *  1. Initialize with provided props (lead, showDetails, className, isLoading).
 *  2. Set up or reference the static score range constants, color mappings, and descriptions.
 *  3. Manage loading or error states in the UI as needed.
 *  4. Optionally set up animation or effect references for real-time updates.
 * 
 * The render function:
 *  1. Calculates the score category and associated color classes.
 *  2. If isLoading is true, displays a loading placeholder within a styled Card.
 *  3. Renders a circular score indicator or simple text, plus ARIA labels and roles.
 *  4. Displays either a tooltip or textual explanations for "showDetails" usage.
 *  5. Ensures keyboard interactions (e.g., focus ring) by leveraging the Card's interactive variant.
 **************************************************************************************************/
const LeadScore: React.FC<LeadScoreProps> = (props) => {
  const { lead, showDetails, className, isLoading } = props;
  const { score } = lead;

  // Derive the category label and color classes
  const category = getScoreCategory(score);
  const colorClass = getScoreColor(score);
  const descriptiveText = scoreDescriptions[category];
  const numericRange = scoreRanges[category];

  // Conditionally render a loading state
  if (isLoading) {
    return (
      <Card
        variant="interactive"
        padding="md"
        className={cn('flex items-center justify-center', className)}
        role="status"
        aria-busy="true"
      >
        <span className="text-sm text-gray-500">Loading score...</span>
      </Card>
    );
  }

  // Main display of the score
  // Using a circle outline to visually depict the scoring; 
  // the text is color-coded, and the tooltip or details are included if showDetails is true.
  return (
    <Card
      variant="interactive"
      padding="md"
      className={cn('relative inline-flex flex-col items-center', className)}
      role="figure"
      aria-label="Lead Score Visualization"
      tabIndex={0}
      onKeyDown={(e) => {
        // Example placeholder for keyboard interaction handling
        if (e.key === 'Enter' || e.key === ' ') {
          // Could trigger tooltip toggles or further expansions
        }
      }}
    >
      {/* Circular score indicator */}
      <div className="relative flex items-center justify-center h-16 w-16 rounded-full border-2 border-gray-300 dark:border-gray-700">
        <span
          className={cn(
            'font-bold text-lg',
            colorClass
          )}
          aria-label={`Lead score is ${score}`}
        >
          {score}
        </span>
      </div>

      {/* Optional descriptive text and tooltips */}
      {showDetails && (
        <div className="mt-2 text-center text-sm text-gray-700 dark:text-gray-300">
          <p className="mb-1">
            <strong>Category:</strong> {category.charAt(0).toUpperCase() + category.slice(1)}
          </p>
          <p className="mb-1">
            <strong>Numeric Range:</strong> {numericRange}
          </p>
          <p>
            <strong>Description:</strong> {descriptiveText}
          </p>
        </div>
      )}
    </Card>
  );
};

export default LeadScore;