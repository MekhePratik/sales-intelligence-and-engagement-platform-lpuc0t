////////////////////////////////////////////////////////////////////////////////
// Internal Import
////////////////////////////////////////////////////////////////////////////////
import { LeadStatus } from '../types/lead'; // Lead status enumeration for table column configuration

////////////////////////////////////////////////////////////////////////////////
// TableColumn Interface
////////////////////////////////////////////////////////////////////////////////
/**
 * Defines the structure of a table column configuration, ensuring full
 * accessibility support including ARIA attributes, sorting, filtering,
 * and responsive display options for different screen sizes.
 */
export interface TableColumn {
  /**
   * A unique identifier for the column, used for internal data handling
   * and referencing specific fields.
   */
  id: string;

  /**
   * The user-facing header text displayed within the column.
   */
  header: string;

  /**
   * A descriptive label announced by screen readers to ensure compliance
   * with WCAG accessibility guidelines.
   */
  accessibilityLabel: string;

  /**
   * Indicates whether this column is sortable and allows ascending or
   * descending reordering of table data.
   */
  sortable: boolean;

  /**
   * Enables filtering capabilities for this column, tying into user-driven
   * or programmatic filter controls.
   */
  filterable: boolean;

  /**
   * Specifies visibility of the column at various breakpoints to optimize
   * the table layout for mobile, tablet, and desktop screens.
   */
  responsive: {
    mobile: boolean;
    tablet: boolean;
    desktop: boolean;
  };

  /**
   * Declares a width for the column in the table layout, typically expressed
   * as a percentage, to maintain column sizing consistency.
   */
  width: string;

  /**
   * Defines the current ARIA sort state for this column (e.g., 'none',
   * 'ascending', or 'descending') to aid screen readers in understanding
   * how data is ordered.
   */
  ariaSort: string;
}

////////////////////////////////////////////////////////////////////////////////
// Pagination and Sorting Constants
////////////////////////////////////////////////////////////////////////////////
/**
 * {@link TABLE_PAGE_SIZES} provides a set of recommended page size options
 * for table pagination, accommodating varying user preferences and data volumes.
 */
export const TABLE_PAGE_SIZES: number[] = [10, 25, 50, 100];

/**
 * {@link DEFAULT_PAGE_SIZE} denotes the default number of rows per page,
 * ensuring a balanced view of data for most scenarios.
 */
export const DEFAULT_PAGE_SIZE: number = 25;

/**
 * {@link TABLE_SORT_DIRECTIONS} enumerates standard ascending and descending
 * sort directions used throughout the table components.
 */
export const TABLE_SORT_DIRECTIONS = {
  ASC: 'asc',
  DESC: 'desc',
} as const;

////////////////////////////////////////////////////////////////////////////////
// Theme-Aware Status Colors
////////////////////////////////////////////////////////////////////////////////
/**
 * {@link TABLE_STATUS_COLORS} maps each {@link LeadStatus} to a light and dark
 * color variant, providing theme-friendly badge styling that meets WCAG contrast
 * requirements for both default and high-contrast interfaces.
 */
export const TABLE_STATUS_COLORS: Record<LeadStatus, { light: string; dark: string }> = {
  [LeadStatus.NEW]: {
    light: '#DCFCE7', // Light green background
    dark: '#15803D',  // Dark green text/element
  },
  [LeadStatus.QUALIFIED]: {
    light: '#E0F2FE', // Light blue background
    dark: '#0284C7',  // Dark blue text/element
  },
  [LeadStatus.CONTACTED]: {
    light: '#FEF9C3', // Light yellow background
    dark: '#CA8A04',  // Dark yellow text/element
  },
  [LeadStatus.ENGAGED]: {
    light: '#FCE7F3', // Light pink background
    dark: '#DB2777',  // Dark pink text/element
  },
  [LeadStatus.CONVERTED]: {
    light: '#E0E7FF', // Light indigo background
    dark: '#312E81',  // Dark indigo text/element
  },
  [LeadStatus.ARCHIVED]: {
    light: '#F3F4F6', // Light gray background
    dark: '#4B5563',  // Dark gray text/element
  },
};

////////////////////////////////////////////////////////////////////////////////
// Lead Table Column Configuration
////////////////////////////////////////////////////////////////////////////////
/**
 * {@link LEAD_TABLE_COLUMNS} provides an exhaustive set of column definitions
 * for rendering leads in a data table, including sorting, filtering, ARIA labels,
 * and responsive breakpoints to meet B2B sales intelligence requirements.
 */
export const LEAD_TABLE_COLUMNS: TableColumn[] = [
  {
    id: 'firstName',
    header: 'First Name',
    accessibilityLabel: 'Lead first name column',
    sortable: true,
    filterable: true,
    responsive: { mobile: true, tablet: true, desktop: true },
    width: '15%',
    ariaSort: 'none',
  },
  {
    id: 'lastName',
    header: 'Last Name',
    accessibilityLabel: 'Lead last name column',
    sortable: true,
    filterable: true,
    responsive: { mobile: true, tablet: true, desktop: true },
    width: '15%',
    ariaSort: 'none',
  },
  {
    id: 'email',
    header: 'Email',
    accessibilityLabel: 'Lead email address column',
    sortable: false,
    filterable: true,
    responsive: { mobile: true, tablet: true, desktop: true },
    width: '25%',
    ariaSort: 'none',
  },
  {
    id: 'companyName',
    header: 'Company',
    accessibilityLabel: 'Lead company name column',
    sortable: true,
    filterable: true,
    responsive: { mobile: false, tablet: true, desktop: true },
    width: '20%',
    ariaSort: 'none',
  },
  {
    id: 'score',
    header: 'Score',
    accessibilityLabel: 'Lead priority score column',
    sortable: true,
    filterable: false,
    responsive: { mobile: false, tablet: true, desktop: true },
    width: '10%',
    ariaSort: 'none',
  },
  {
    id: 'status',
    header: 'Status',
    accessibilityLabel: 'Lead status column',
    sortable: true,
    filterable: true,
    responsive: { mobile: true, tablet: true, desktop: true },
    width: '15%',
    ariaSort: 'none',
  },
];

////////////////////////////////////////////////////////////////////////////////
// Campaign Table Column Configuration
////////////////////////////////////////////////////////////////////////////////
/**
 * {@link CAMPAIGN_TABLE_COLUMNS} outlines columns for displaying campaign data,
 * emphasizing accessibility, performance metrics, and responsiveness, aiding
 * in streamlined campaign oversight and analysis.
 */
export const CAMPAIGN_TABLE_COLUMNS: TableColumn[] = [
  {
    id: 'name',
    header: 'Campaign Name',
    accessibilityLabel: 'Campaign name column',
    sortable: true,
    filterable: true,
    responsive: { mobile: true, tablet: true, desktop: true },
    width: '25%',
    ariaSort: 'none',
  },
  {
    id: 'status',
    header: 'Status',
    accessibilityLabel: 'Campaign status column',
    sortable: true,
    filterable: true,
    responsive: { mobile: true, tablet: true, desktop: true },
    width: '15%',
    ariaSort: 'none',
  },
  {
    id: 'opens',
    header: 'Opens',
    accessibilityLabel: 'Number of opens column',
    sortable: true,
    filterable: false,
    responsive: { mobile: false, tablet: true, desktop: true },
    width: '10%',
    ariaSort: 'none',
  },
  {
    id: 'conversions',
    header: 'Conversions',
    accessibilityLabel: 'Campaign conversions column',
    sortable: true,
    filterable: false,
    responsive: { mobile: false, tablet: true, desktop: true },
    width: '15%',
    ariaSort: 'none',
  },
  {
    id: 'createdAt',
    header: 'Created At',
    accessibilityLabel: 'Date when campaign was created',
    sortable: true,
    filterable: false,
    responsive: { mobile: false, tablet: true, desktop: true },
    width: '15%',
    ariaSort: 'none',
  },
  {
    id: 'updatedAt',
    header: 'Last Updated',
    accessibilityLabel: 'Recent campaign update timestamp column',
    sortable: true,
    filterable: false,
    responsive: { mobile: false, tablet: true, desktop: true },
    width: '20%',
    ariaSort: 'none',
  },
];