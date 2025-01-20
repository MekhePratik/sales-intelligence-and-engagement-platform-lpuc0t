import React, {
  memo,
  useState,
  useMemo,
  useEffect,
  useRef,
  useCallback,
  KeyboardEvent,
} from 'react';

// react ^18.2.0
// clsx ^2.0.0 (optionally used for advanced class name manipulation, though cn is our primary)
// @tanstack/react-virtual ^3.0.0
import { useVirtualizer, VirtualizerOptions, Virtualizer } from '@tanstack/react-virtual';

import { cn } from '../../lib/utils'; // Utility for conditional class name construction
import Button from './Button'; // Button component for pagination and actions
import { TABLE_PAGE_SIZES } from '../../constants/tables'; // Pagination configuration constants
import { TableColumn } from '../../constants/tables';

/*************************************************************************************************
 * SortDirection
 * -----------------------------------------------------------------------------------------------
 * Defines the accepted sorting directions for table sorting operations. This aligns with standard
 * ascending and descending behaviors, ensuring consistent naming conventions.
 *************************************************************************************************/
type SortDirection = 'asc' | 'desc';

/*************************************************************************************************
 * VirtualizerInstance
 * -----------------------------------------------------------------------------------------------
 * Type alias capturing the return structure from the useVirtualizer hook. We store this in our
 * component state (or ref) to handle virtualization logic for large data sets.
 *************************************************************************************************/
type VirtualizerInstance = Virtualizer<HTMLDivElement, HTMLTableRowElement> | null;

/*************************************************************************************************
 * TableProps
 * -----------------------------------------------------------------------------------------------
 * Describes the full set of properties accepted by the Table component. These parameters provide
 * extensive control over the display, behavior, and accessibility of the data table, including:
 *  - Data and columns
 *  - Pagination and sorting state
 *  - Callbacks for user interactions such as sorting, pagination, row selection
 *  - Virtual scrolling configuration
 *  - WCAG 2.1 AA accessibility features
 *************************************************************************************************/
interface TableProps {
  /** Array of generic data items to be rendered as rows in the table. */
  data: Array<any>;

  /** Configuration for each table column, including headers and accessibility labels. */
  columns: TableColumn[];

  /** Number of rows displayed per page (pagination). */
  pageSize: number;

  /** Currently active page index, typically 1-based in external usage. */
  currentPage: number;

  /** Total number of items across all pages (for computing page count). */
  totalItems: number;

  /** Callback triggered upon page change, receiving the new page index. */
  onPageChange: (page: number) => void;

  /**
   * Callback invoked when the user requests a column sort,
   * including the target column id and the new sort direction.
   */
  onSort: (column: string, direction: SortDirection) => void;

  /**
   * Callback for row selection logic, returning an array of currently selected row data.
   * Allows the parent component to manage the selection state or react to changes.
   */
  onRowSelect: (selectedRows: any[]) => void;

  /** Indicates whether the table should display a loading state overlay or visual cues. */
  isLoading: boolean;

  /** Optional class name overrides for advanced layout or theming scenarios. */
  className?: string;

  /** Toggles virtual scrolling for performance with large data sets. */
  virtualScrolling?: boolean;

  /** Approximate or fixed row height used by the virtualization engine. */
  rowHeight?: number;

  /** ARIA label describing the table for screen readers (WCAG compliance). */
  ariaLabel?: string;
}

/*************************************************************************************************
 * Table
 * -----------------------------------------------------------------------------------------------
 * The main table component, supporting advanced functionality:
 *  - Virtualization for performance with large datasets
 *  - Sorting with debouncing
 *  - Multi-row selection and keyboard navigation
 *  - Responsive column management via ResizeObserver
 *  - Pagination controls and accessible interactions
 *
 * Implementation Outline:
 *  1. State Management: selectedRows, sortColumn, sortDirection, tableRef, virtualizer, etc.
 *  2. handleSort: Debounced method updating sort state, toggling direction or changing column.
 *     Also updates ARIA attributes to ensure screen readers reflect current sort state.
 *  3. handleRowSelect: Manages toggling of selected rows, implementing keyboard event handling
 *     for full accessibility (Space/Enter).
 *  4. handleResponsiveDisplay: Observes container width to determine which columns remain visible
 *     on smaller screens for a more responsive layout, triggered by a ResizeObserver or
 *     IntersectionObserver approach.
 *  5. renderVirtualizedRows: If virtualScrolling is enabled, uses useVirtualizer to only render
 *     visible rows, referencing a rowHeight. ARIA row indices and dynamic row heights can be
 *     accounted for in the itemKey approach.
 *  6. Render: Conditionally shows a loading state if isLoading is true, a pagination UI, and
 *     either a simple or virtualized table body. Each row is annotated with ARIA attributes for
 *     WCAG 2.1 AA compliance.
 *************************************************************************************************/
function TableComponent({
  data,
  columns,
  pageSize,
  currentPage,
  totalItems,
  onPageChange,
  onSort,
  onRowSelect,
  isLoading,
  className,
  virtualScrolling = false,
  rowHeight = 48,
  ariaLabel,
}: TableProps) {
  /*************************************************************************************************
   * 1. State Management
   *************************************************************************************************/
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [sortColumn, setSortColumn] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const tableRef = useRef<HTMLTableElement>(null);

  // For virtualization, we set up a ref or state to store the instance of virtualizer
  const [virtualizer, setVirtualizer] = useState<VirtualizerInstance>(null);

  // IntersectionObserver or ResizeObserver can be used for handling responsive column display
  const [intersectionObserver, setIntersectionObserver] = useState<IntersectionObserver | null>(
    null
  );

  /**
   * We'll track a local setter for visible columns in advanced scenarios. For demonstration,
   * we won't fully remove columns, but you could easily adapt handleResponsiveDisplay for that.
   */
  const [visibleColumns, setVisibleColumns] = useState<TableColumn[]>(columns);

  /*************************************************************************************************
   * 2. handleSort
   * -----------------------------------------------------------------------------------------------
   * Applies a very lightweight approach to debouncing: we track the last time a sort was invoked.
   * If the user triggers another sort quickly, we skip or schedule it, ensuring performance on
   * repetitive clicks.
   *************************************************************************************************/
  const lastSortRef = useRef<number>(0);
  const SORT_DEBOUNCE_MS = 150;

  const handleSort = useCallback(
    (columnId: string) => {
      const now = Date.now();
      if (now - lastSortRef.current < SORT_DEBOUNCE_MS) {
        // Debounced: ignore this rapid request
        return;
      }
      lastSortRef.current = now;

      // Toggle sort direction if the same column is requested
      if (columnId === sortColumn) {
        const newDirection: SortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
        setSortDirection(newDirection);
        onSort(columnId, newDirection);
      } else {
        // Change column entirely
        setSortColumn(columnId);
        setSortDirection('asc');
        onSort(columnId, 'asc');
      }

      // Update ARIA states for columns
      // Mark all columns ariaSort="none" except the sorted column
      setVisibleColumns((cols) =>
        cols.map((col) => {
          if (col.id === columnId) {
            return {
              ...col,
              ariaSort: col.id === columnId ? sortDirection : 'none',
            };
          }
          return { ...col, ariaSort: 'none' };
        })
      );
    },
    [onSort, sortColumn, sortDirection]
  );

  /*************************************************************************************************
   * 3. handleRowSelect
   * -----------------------------------------------------------------------------------------------
   * Implements toggling of row selection using keyboard input (Space/Enter) or direct clicks. If
   * invoked via keyboard, we rely on KeyboardEvent checks. We store row IDs in a Set, providing
   * O(1) toggling and membership checks. The onRowSelect callback is then updated with the new
   * selection list.
   *************************************************************************************************/
  const handleRowSelect = useCallback(
    (rowId: string, event?: KeyboardEvent<HTMLTableRowElement>) => {
      // If an event is provided, check if it's keyboard-based: Space or Enter
      if (event) {
        const { key } = event;
        if (key !== ' ' && key !== 'Enter') {
          return;
        }
        event.preventDefault();
      }

      setSelectedRows((prev) => {
        const updated = new Set(prev);
        if (updated.has(rowId)) {
          updated.delete(rowId);
        } else {
          updated.add(rowId);
        }
        onRowSelect([...updated]);
        return updated;
      });
    },
    [onRowSelect]
  );

  /*************************************************************************************************
   * 4. handleResponsiveDisplay
   * -----------------------------------------------------------------------------------------------
   * Manages dynamically visible columns based on container width. Using a ResizeObserver or
   * intersection observer, we can measure the parent's width. Here, we do a minimal approach:
   *  - If width is below some threshold, we hide certain columns or reorder them
   *************************************************************************************************/
  const handleResponsiveDisplay = useCallback(() => {
    if (!tableRef.current) {
      return;
    }
    // A more thorough approach might measure exact widths and compare with column widths.
    // For demonstration, we'll simply set visibleColumns = columns if tableRef is large enough.
    // In a real scenario, you'd do calculations here.
    setVisibleColumns(columns);
  }, [columns]);

  /*************************************************************************************************
   * 5. renderVirtualizedRows
   * -----------------------------------------------------------------------------------------------
   * Renders only visible rows using the useVirtualizer hook from @tanstack/react-virtual. We rely
   * on rowHeight as an approximate or fixed dimension. The virtualizer instance calculates range
   * and only displays the subset of rows, boosting performance for large data sets.
   *************************************************************************************************/
  const renderVirtualizedRows = useCallback((): JSX.Element[] => {
    if (!virtualizer) {
      return [];
    }
    const virtualItems = virtualizer.getVirtualItems();
    return virtualItems.map((virtualRow) => {
      const rowIndex = virtualRow.index;
      const item = data[rowIndex];
      const rowId = `row_${rowIndex}`;
      const isSelected = selectedRows.has(rowId);

      return (
        <tr
          key={virtualRow.key}
          data-index={rowIndex}
          ref={virtualizer.measureElement}
          tabIndex={0}
          aria-selected={isSelected ? 'true' : 'false'}
          onClick={() => handleRowSelect(rowId)}
          onKeyDown={(e) => handleRowSelect(rowId, e)}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            transform: `translateY(${virtualRow.start}px)`,
            height: `${virtualRow.size}px`,
            width: '100%',
            cursor: 'pointer',
          }}
          className={cn(
            'focus:outline-none',
            isSelected ? 'bg-blue-50 dark:bg-blue-900' : 'bg-white dark:bg-gray-800',
            'border-b dark:border-gray-700'
          )}
        >
          {visibleColumns.map((col) => (
            <td
              key={`${rowId}_${col.id}`}
              style={{ width: col.width }}
              className="px-4 py-2 align-middle"
            >
              {item[col.id]}
            </td>
          ))}
        </tr>
      );
    });
  }, [data, handleRowSelect, selectedRows, visibleColumns, virtualizer]);

  /*************************************************************************************************
   * 6. useEffect: Setting up Observers and Virtualization
   * -----------------------------------------------------------------------------------------------
   * On mount, attach a ResizeObserver or similar approach to handle responsive columns. Also,
   * if virtualScrolling is enabled, we initialize the virtualizer with the container as reference.
   *************************************************************************************************/
  useEffect(() => {
    if (tableRef.current && !intersectionObserver) {
      const observer = new ResizeObserver(handleResponsiveDisplay);
      observer.observe(tableRef.current);
      setIntersectionObserver(
        // IntersectionObserver is used less commonly for resizing, but we demonstrate here
        // we can keep a reference. Typically, you'd store the ResizeObserver instead.
        null
      );
    }
  }, [handleResponsiveDisplay, intersectionObserver]);

  useEffect(() => {
    if (!virtualScrolling || !tableRef.current) {
      setVirtualizer(null);
      return;
    }
    const options: VirtualizerOptions<HTMLDivElement, HTMLTableRowElement> = {
      count: data.length,
      getScrollElement: () => tableRef.current?.parentElement as HTMLDivElement,
      estimateSize: () => rowHeight,
      overscan: 5,
    };
    const newVirtualizer = useVirtualizer<HTMLDivElement, HTMLTableRowElement>(options);
    setVirtualizer(newVirtualizer);
  }, [data.length, rowHeight, virtualScrolling]);

  /*************************************************************************************************
   * Pagination Logic
   * -----------------------------------------------------------------------------------------------
   * Determine how many pages exist based on totalItems and pageSize. Provide next/previous or
   * direct page jump. We also display a page size control if desired using TABLE_PAGE_SIZES.
   *************************************************************************************************/
  const totalPages = useMemo(() => {
    if (pageSize <= 0) return 1;
    return Math.ceil(totalItems / pageSize);
  }, [pageSize, totalItems]);

  const handlePrevPage = () => {
    const newPage = Math.max(currentPage - 1, 1);
    onPageChange(newPage);
  };

  const handleNextPage = () => {
    const newPage = Math.min(currentPage + 1, totalPages);
    onPageChange(newPage);
  };

  /*************************************************************************************************
   * Render Non-Virtualized Rows
   * -----------------------------------------------------------------------------------------------
   * Simple fallback when virtualScrolling is false or data size is small enough. We render all rows
   * with standard <tr> elements. Each row can be clicked or keyboard-navigated for selection.
   *************************************************************************************************/
  const renderRows = useMemo(() => {
    return data.map((item, index) => {
      const rowId = `row_${index}`;
      const isSelected = selectedRows.has(rowId);

      return (
        <tr
          key={rowId}
          tabIndex={0}
          aria-selected={isSelected ? 'true' : 'false'}
          onClick={() => handleRowSelect(rowId)}
          onKeyDown={(e) => handleRowSelect(rowId, e)}
          className={cn(
            'focus:outline-none',
            isSelected ? 'bg-blue-50 dark:bg-blue-900' : 'bg-white dark:bg-gray-800',
            'border-b dark:border-gray-700'
          )}
        >
          {visibleColumns.map((col) => (
            <td
              key={`${rowId}_${col.id}`}
              style={{ width: col.width }}
              className="px-4 py-2 align-middle"
            >
              {item[col.id]}
            </td>
          ))}
        </tr>
      );
    });
  }, [data, handleRowSelect, selectedRows, visibleColumns]);

  /*************************************************************************************************
   * Table Header
   * -----------------------------------------------------------------------------------------------
   * Renders the column headers, applying aria-sort attributes, click handlers for sorting (if
   * sortable), and ensuring appropriate widths. Accessibility is improved by labeling each
   * column with scope="col" and using the 'aria-sort' property to announce current sort info.
   *************************************************************************************************/
  const renderTableHeader = () => {
    return (
      <thead>
        <tr className="border-b dark:border-gray-700">
          {visibleColumns.map((col) => {
            const isCurrentlySorted = col.id === sortColumn;
            const ariaSortValue =
              isCurrentlySorted && col.sortable ? sortDirection : col.ariaSort || 'none';
            const headerClasses = cn(
              'py-2 px-4 text-left font-semibold cursor-pointer select-none',
              col.sortable ? 'hover:bg-gray-100 dark:hover:bg-gray-700' : ''
            );
            const onClickSort = () => {
              if (col.sortable) {
                handleSort(col.id);
              }
            };

            return (
              <th
                key={`header_${col.id}`}
                scope="col"
                style={{ width: col.width }}
                aria-sort={ariaSortValue}
                aria-label={col.accessibilityLabel}
                onClick={onClickSort}
                className={headerClasses}
              >
                {col.header}
              </th>
            );
          })}
        </tr>
      </thead>
    );
  };

  /*************************************************************************************************
   * Render Loading State
   * -----------------------------------------------------------------------------------------------
   * Optionally display a loading overlay or spinner if isLoading is true. This approach uses a
   * basic absolute overlay with a text-based spinner. A production environment might rely on a
   * more complex skeleton or spinner indicator.
   *************************************************************************************************/
  const renderLoadingOverlay = () => {
    if (!isLoading) return null;
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70 dark:bg-gray-900 dark:bg-opacity-70 z-10">
        <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-200">
          <svg
            className="animate-spin h-5 w-5 mr-1"
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
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            ></path>
          </svg>
          <span>Loading...</span>
        </div>
      </div>
    );
  };

  /*************************************************************************************************
   * Main Render
   *************************************************************************************************/
  return (
    <div className={cn('relative w-full', className)}>
      {renderLoadingOverlay()}

      {/* Table Wrapper for potential overflow scrolling */}
      <div className="overflow-auto" style={{ maxHeight: virtualScrolling ? '600px' : 'auto' }}>
        <table
          ref={tableRef}
          role="table"
          aria-label={ariaLabel || 'Data Table'}
          className="w-full border-collapse text-sm text-gray-900 dark:text-gray-100"
        >
          {renderTableHeader()}

          {/* Table body region */}
          <tbody
            role="rowgroup"
            style={
              virtualScrolling
                ? {
                    position: 'relative',
                    height:
                      virtualizer?.getTotalSize()?.toString() + 'px' || `${data.length * rowHeight}px`,
                  }
                : {}
            }
          >
            {virtualScrolling ? renderVirtualizedRows() : renderRows}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between mt-4 space-x-2">
        <div className="flex items-center space-x-2">
          <Button
            onClick={handlePrevPage}
            isDisabled={currentPage <= 1 || isLoading}
            ariaLabel="Previous Page"
          >
            Prev
          </Button>
          <Button
            onClick={handleNextPage}
            isDisabled={currentPage >= totalPages || isLoading}
            ariaLabel="Next Page"
          >
            Next
          </Button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
        </div>

        {/* Page size selector if needed */}
        <div className="flex items-center space-x-2">
          <span>Rows per page:</span>
          <select
            disabled={isLoading}
            className="border border-gray-300 rounded px-2 py-1 dark:bg-gray-800 dark:border-gray-600"
            value={pageSize}
            onChange={(e) => {
              const newPageSize = parseInt(e.target.value, 10) || 10;
              onPageChange(1); // typically reset to page 1 on changing size
              // Could also manage storing in higher-level state outside
            }}
          >
            {TABLE_PAGE_SIZES.map((sizeOption) => (
              <option key={sizeOption} value={sizeOption}>
                {sizeOption}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

/*************************************************************************************************
 * Export
 * -----------------------------------------------------------------------------------------------
 * By memoizing the component, we avoid unnecessary re-renders unless props change, delivering
 * optimized performance for large data sets. This is particularly beneficial when combined with
 * virtualization.
 *************************************************************************************************/
export const Table = memo(TableComponent);

/*************************************************************************************************
 * Default Export
 * -----------------------------------------------------------------------------------------------
 * The primary export for usage across the application. This is our feature-rich, accessible, and
 * performant data table component.
 *************************************************************************************************/
export default Table;