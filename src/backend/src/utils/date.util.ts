/**
 * Comprehensive date manipulation utility providing standardized date handling,
 * timezone support, and duration calculations for campaign scheduling, analytics,
 * and activity tracking across the B2B sales intelligence platform.
 */

// ----------------------------------------
// External Imports (dayjs@^1.11.0)
// ----------------------------------------
import dayjs from 'dayjs'; // dayjs core library
// dayjs/plugin/utc@^1.11.0
import utc from 'dayjs/plugin/utc';
// dayjs/plugin/timezone@^1.11.0
import timezone from 'dayjs/plugin/timezone';
// dayjs/plugin/duration@^1.11.0
import duration from 'dayjs/plugin/duration';

// Extend dayjs with required plugins
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(duration);

/**
 * DEFAULT_DATE_FORMAT
 * A standardized date format used across the system for consistency.
 */
export const DEFAULT_DATE_FORMAT: string = 'YYYY-MM-DD HH:mm:ss';

/**
 * SUPPORTED_DATE_UNITS
 * List of acceptable units for date manipulation and difference calculations.
 */
export const SUPPORTED_DATE_UNITS: string[] = [
  'year',
  'month',
  'week',
  'day',
  'hour',
  'minute',
  'second',
];

/**
 * DEFAULT_TIMEZONE
 * The default timezone (UTC) for handling all date operations consistently.
 */
export const DEFAULT_TIMEZONE: string = 'UTC';

/**
 * formatDate
 * Formats a date string or timestamp into a standardized format with timezone support.
 *
 * Steps:
 * 1. Validate the input date parameter type and value.
 * 2. Validate the format string against supported formats (fallback to DEFAULT_DATE_FORMAT if invalid).
 * 3. Validate the timezone against the IANA timezone database.
 * 4. Convert the input to a dayjs object with the specified timezone.
 * 5. Apply the specified format, or use DEFAULT_DATE_FORMAT if not provided.
 * 6. Handle invalid date errors by throwing an Error if encountered.
 * 7. Return the formatted date string.
 *
 * @param date Date | string | number - The source date or timestamp to format
 * @param format string - The desired date format
 * @param timezone string - The timezone to apply
 * @returns string - The formatted date string
 */
export function formatDate(
  date: Date | string | number,
  format: string = DEFAULT_DATE_FORMAT,
  timezone: string = DEFAULT_TIMEZONE
): string {
  // 1. Validate that date parameter is not null or undefined
  if (date === null || date === undefined) {
    throw new Error('formatDate: Provided date value is null or undefined.');
  }

  // 2. Validate or fallback the format string
  let chosenFormat = format;
  if (!chosenFormat || typeof chosenFormat !== 'string') {
    chosenFormat = DEFAULT_DATE_FORMAT;
  }

  // 3. Validate the timezone by checking if dayjs can find a valid zone
  if (!dayjs.tz.zone(timezone)) {
    throw new Error(
      `formatDate: Provided timezone "${timezone}" is invalid or not recognized.`
    );
  }

  // 4. Convert input to dayjs object with the specified timezone
  const dateObj = dayjs.tz(date, timezone);

  // 5. Check if the date object is valid
  if (!dateObj.isValid()) {
    throw new Error(`formatDate: Unable to parse the provided date: ${date}`);
  }

  // 6. Format the date
  return dateObj.format(chosenFormat);
}

/**
 * parseDate
 * Parses a date string into a standardized Date object with format and timezone support.
 *
 * Steps:
 * 1. Validate the input date string is defined.
 * 2. Validate the format string if provided.
 * 3. Validate the timezone against the IANA timezone database.
 * 4. Parse the date string using the specified format and timezone.
 * 5. Check for validity of the resulting date object.
 * 6. Convert to an actual UTC Date object internally.
 * 7. Return the parsed Date instance.
 *
 * @param dateString string - The date string to parse
 * @param format string - Optional format pattern to assist parsing
 * @param timezone string - The timezone to assume while parsing
 * @returns Date - The resulting Date object, referenced in UTC
 */
export function parseDate(
  dateString: string,
  format: string = DEFAULT_DATE_FORMAT,
  timezone: string = DEFAULT_TIMEZONE
): Date {
  // 1. Validate the input date string
  if (!dateString) {
    throw new Error('parseDate: Provided dateString is empty or undefined.');
  }

  // 2. Validate the format argument if necessary, fallback to default if invalid
  let chosenFormat = format;
  if (!chosenFormat || typeof chosenFormat !== 'string') {
    chosenFormat = DEFAULT_DATE_FORMAT;
  }

  // 3. Validate the timezone
  if (!dayjs.tz.zone(timezone)) {
    throw new Error(
      `parseDate: Provided timezone "${timezone}" is invalid or not recognized.`
    );
  }

  // 4. Parse using dayjs with the specified format and timezone
  const parsedDayjs = dayjs.tz(dateString, chosenFormat, timezone);

  // 5. Check if the parsed date is valid
  if (!parsedDayjs.isValid()) {
    throw new Error(`parseDate: Unable to parse date string: ${dateString}`);
  }

  // 6. Convert the dayjs object to an actual JavaScript Date in UTC
  return new Date(parsedDayjs.valueOf());
}

/**
 * calculateDateDiff
 * Calculates the difference between two dates in a specified unit, with timezone support.
 *
 * Steps:
 * 1. Validate the input startDate and endDate.
 * 2. Validate the specified unit against SUPPORTED_DATE_UNITS.
 * 3. Validate the provided timezone.
 * 4. Convert both dates to dayjs objects in the specified timezone.
 * 5. Calculate the difference according to the requested unit.
 * 6. Handle any potential timezone transitions (dayjs manages seamlessly).
 * 7. Return the numeric difference.
 *
 * @param startDate Date | string - The start of the range
 * @param endDate Date | string - The end of the range
 * @param unit string - The unit in which to measure the difference
 * @param timezone string - The timezone context
 * @returns number - The difference in the specified unit
 */
export function calculateDateDiff(
  startDate: Date | string,
  endDate: Date | string,
  unit: string = 'day',
  timezone: string = DEFAULT_TIMEZONE
): number {
  // 1. Validate the input date parameters
  if (!startDate || !endDate) {
    throw new Error(
      'calculateDateDiff: Both startDate and endDate must be provided.'
    );
  }

  // 2. Validate the unit
  if (!SUPPORTED_DATE_UNITS.includes(unit)) {
    throw new Error(
      `calculateDateDiff: The unit "${unit}" is not supported. Supported units are: ${SUPPORTED_DATE_UNITS.join(
        ', '
      )}.`
    );
  }

  // 3. Validate the timezone
  if (!dayjs.tz.zone(timezone)) {
    throw new Error(
      `calculateDateDiff: Provided timezone "${timezone}" is invalid or not recognized.`
    );
  }

  // 4. Convert to dayjs objects in the specified timezone
  const start = dayjs.tz(startDate, timezone);
  const end = dayjs.tz(endDate, timezone);

  if (!start.isValid() || !end.isValid()) {
    throw new Error('calculateDateDiff: Invalid startDate or endDate provided.');
  }

  // 5. Calculate the difference
  const diffValue = end.diff(start, unit as dayjs.OpUnitType);

  // 7. Return the numeric difference
  return diffValue;
}

/**
 * addToDate
 * Adds a specified duration to a date with timezone consideration.
 *
 * Steps:
 * 1. Validate the input date and ensure it is valid.
 * 2. Validate the amount as a positive number.
 * 3. Validate the unit against SUPPORTED_DATE_UNITS.
 * 4. Validate the timezone for correctness.
 * 5. Convert the date to a dayjs object in the specified timezone.
 * 6. Add the specified duration amount and unit.
 * 7. Handle any timezone transitions automatically (dayjs manages that).
 * 8. Return the resulting date as a JavaScript Date object.
 *
 * @param date Date | string - The base date to manipulate
 * @param amount number - The numeric amount of time to add
 * @param unit string - The unit for the time addition (e.g., 'day', 'hour', etc.)
 * @param timezone string - The applicable timezone
 * @returns Date - The new date, with the added duration
 */
export function addToDate(
  date: Date | string,
  amount: number,
  unit: string = 'day',
  timezone: string = DEFAULT_TIMEZONE
): Date {
  // 1. Validate the input date
  if (!date) {
    throw new Error('addToDate: The date parameter is required and cannot be null.');
  }

  // 2. Validate the amount
  if (typeof amount !== 'number' || isNaN(amount) || amount < 0) {
    throw new Error(
      `addToDate: The addition amount must be a non-negative number. Provided: ${amount}`
    );
  }

  // 3. Validate the unit
  if (!SUPPORTED_DATE_UNITS.includes(unit)) {
    throw new Error(
      `addToDate: The unit "${unit}" is not supported. Supported units are: ${SUPPORTED_DATE_UNITS.join(
        ', '
      )}.`
    );
  }

  // 4. Validate the timezone
  if (!dayjs.tz.zone(timezone)) {
    throw new Error(
      `addToDate: Provided timezone "${timezone}" is invalid or not recognized.`
    );
  }

  // 5. Convert the date to a dayjs object in the specified timezone
  const base = dayjs.tz(date, timezone);
  if (!base.isValid()) {
    throw new Error(`addToDate: Invalid date provided: ${date}`);
  }

  // 6. Add the specified duration
  const result = base.add(amount, unit as dayjs.OpUnitType);

  // 8. Return the final Date object (the internal reference is UTC but correct moment in time)
  return new Date(result.valueOf());
}

/**
 * getDateRange
 * Generates start and end dates for a specified time range with timezone support.
 *
 * Steps:
 * 1. Validate the range parameter against supported patterns (common segments like 'today', 'week', etc.).
 * 2. Validate the timezone for correctness.
 * 3. Calculate the start date based on the provided range in the specified timezone.
 * 4. Set the end date to the current time in the same timezone (unless range dictates otherwise).
 * 5. Handle timezone transitions and apply final adjustments if needed.
 * 6. Return the resulting startDate and endDate as Date objects.
 *
 * @param range string - The named range to generate (e.g., 'today', 'week', 'month')
 * @param timezone string - The timezone to apply
 * @returns { startDate: Date; endDate: Date } - The computed range boundaries
 */
export function getDateRange(
  range: string,
  timezone: string = DEFAULT_TIMEZONE
): { startDate: Date; endDate: Date } {
  // 1. Validate the range parameter. Here we define a small set of common ranges.
  //    You can extend or modify this logic as needed for the platform's analytics.
  const supportedRanges = [
    'today',
    'lastWeek',
    'lastMonth',
    'lastYear',
    'weekToDate',
    'monthToDate',
    'yearToDate',
  ];
  if (!supportedRanges.includes(range)) {
    throw new Error(
      `getDateRange: Unsupported range "${range}". Supported ranges: ${supportedRanges.join(
        ', '
      )}.`
    );
  }

  // 2. Validate the timezone
  if (!dayjs.tz.zone(timezone)) {
    throw new Error(
      `getDateRange: Provided timezone "${timezone}" is invalid or not recognized.`
    );
  }

  // 3 & 4. Initialize the start/end reference in the specified timezone
  const now = dayjs().tz(timezone);
  let start = now;
  let end = now;

  switch (range) {
    case 'today':
      start = now.startOf('day');
      end = now.endOf('day');
      break;
    case 'lastWeek':
      start = now.subtract(1, 'week');
      break;
    case 'lastMonth':
      start = now.subtract(1, 'month');
      break;
    case 'lastYear':
      start = now.subtract(1, 'year');
      break;
    case 'weekToDate':
      start = now.startOf('week');
      break;
    case 'monthToDate':
      start = now.startOf('month');
      break;
    case 'yearToDate':
      start = now.startOf('year');
      break;
    default:
      // If it somehow doesn't match, throw usage error
      throw new Error(`getDateRange: Range "${range}" is unrecognized.`);
  }

  // For lastWeek, lastMonth, lastYear, we set the end to "now" by default
  // which is correct in the branch logic above.

  // 5. Final adjustments are automatically handled by dayjs for transitions

  // 6. Return the range as standard Date objects
  return {
    startDate: new Date(start.valueOf()),
    endDate: new Date(end.valueOf()),
  };
}

/**
 * isValidDate
 * Validates if a given value is a valid date with optional format and timezone checking.
 *
 * Steps:
 * 1. Check if the value is defined.
 * 2. Validate the format if provided, otherwise skip.
 * 3. Validate the timezone if provided.
 * 4. Attempt to parse as a date with the given format/timezone.
 * 5. Verify the resulting date is valid.
 * 6. Check timezone validity if specified.
 * 7. Return true if valid, false otherwise.
 *
 * @param value any - The value to check for date validity
 * @param format string - An optional format to strictly parse the date
 * @param timezone string - An optional timezone to apply
 * @returns boolean - True if the value is a valid date, false otherwise
 */
export function isValidDate(
  value: any,
  format?: string,
  timezone?: string
): boolean {
  // 1. Check if value is defined
  if (value === null || value === undefined) {
    return false;
  }

  // 2. Validate the format or fallback to default if none provided
  const chosenFormat = format || DEFAULT_DATE_FORMAT;

  // 3. Validate the timezone if provided
  const chosenTz = timezone || DEFAULT_TIMEZONE;
  if (!dayjs.tz.zone(chosenTz)) {
    return false;
  }

  // 4. Attempt to parse
  const parsed = dayjs.tz(value, chosenFormat, chosenTz);

  // 5. Verify if valid
  if (!parsed.isValid()) {
    return false;
  }

  // 6. If the code reaches here, the parse is valid
  return true;
}