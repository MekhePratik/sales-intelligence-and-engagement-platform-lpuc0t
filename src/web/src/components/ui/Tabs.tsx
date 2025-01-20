/********************************************************************************************
 * @file Tabs.tsx
 * @version 1.0.0
 * @description
 * A comprehensive Tabs component implementing the design system's tab navigation pattern
 * with enhanced accessibility, keyboard navigation, and state management. Supports both
 * controlled and uncontrolled modes, full ARIA compliance, RTL layout, lazy loading of
 * tab panels via IntersectionObserver, and vertical/horizontal orientation.
 *
 * External Dependencies:
 *   - react ^18.2.0 (for component creation and hooks)
 *
 * Internal Dependencies:
 *   - cn (named import) from '../../lib/utils' (for conditional class name construction)
 *
 * Requirements Addressed:
 *   1. Design System Implementation (typography, colors, spacing per specification)
 *   2. Accessibility Requirements (WCAG 2.1 AA keyboard navigable tabs)
 *
 * Export:
 *   - Default React Functional Component: Tabs
 ********************************************************************************************/

import React, {
  useCallback,
  useState,
  useEffect,
  useRef,
  useMemo,
  KeyboardEvent,
  MouseEvent,
} from 'react';
// Import from internal utilities
import { cn } from '../../lib/utils';

/********************************************************************************************
 * Interface Definition for TabsProps
 * ------------------------------------------------------------------------------------------
 * items: string[]               -> List of tab labels to display.
 * defaultIndex?: number         -> Default active tab (uncontrolled) if activeIndex undefined.
 * activeIndex?: number          -> Explicitly controlled tab index (if using controlled mode).
 * onChange?: (index: number) => void    -> Callback invoked whenever the active tab changes.
 * className?: string            -> Optional custom class for top-level container.
 * children?: React.ReactNode    -> JSX representing tab panels or advanced content.
 * vertical?: boolean            -> Renders tabs vertically if true; horizontal otherwise.
 * rtl?: boolean                 -> Enables RTL layout direction if true.
 ********************************************************************************************/
interface TabsProps {
  items: string[];
  defaultIndex?: number;
  activeIndex?: number;
  onChange?: (index: number) => void;
  className?: string;
  children?: React.ReactNode;
  vertical?: boolean;
  rtl?: boolean;
}

/********************************************************************************************
 * Internal State and Refs
 * ------------------------------------------------------------------------------------------
 * In a functional component, these properties correspond to local state variables and refs:
 *  - defaultIndex: number        -> Resolved initialization index for uncontrolled scenario.
 *  - tabRefs: React.RefObject<HTMLDivElement[]> -> Array of refs for each tab.
 *  - isControlled: boolean       -> Flag to determine if activeIndex is controlled externally.
 ********************************************************************************************/

const Tabs: React.FC<TabsProps> = ({
  items,
  defaultIndex = 0,
  activeIndex,
  onChange,
  className,
  children,
  vertical = false,
  rtl = false,
}) => {
  /******************************************************************************************
   * Step 1 (Constructor Equivalent): Determine controlled vs uncontrolled usage and set up
   * initial state. Also create references for each tab and define intersection observer for
   * lazy loading of tab panels.
   ******************************************************************************************/
  const isControlled = useMemo(() => typeof activeIndex === 'number', [activeIndex]);

  // For uncontrolled mode, maintain state internally. Otherwise, rely on props.activeIndex.
  const [internalActiveIndex, setInternalActiveIndex] = useState<number>(defaultIndex);

  // Refs array for focusing tabs and enabling ARIA-based keyboard navigation.
  // We store each tab's reference at the index matching that tab.
  const tabRefs = useRef<HTMLDivElement[]>([]);

  // Lazy loading mechanism: track if a panel has been intersected/loaded.
  const [lazyLoadedPanels, setLazyLoadedPanels] = useState<boolean[]>(
    () => new Array(items.length).fill(false)
  );

  // Intersection observer setup to load panels on intersection if desired.
  // This is an optional advanced approach to lazy load tab panels even if user
  // navigates them by scrolling in a certain layout. If your design does not
  // require IntersectionObserver, you can adapt as needed.
  const observer = useRef<IntersectionObserver | null>(null);

  // Initialize the intersection observer once (lifecycle setup).
  useEffect(() => {
    if (!observer.current) {
      observer.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const indexStr = entry.target.getAttribute('data-panel-index');
            if (indexStr && entry.isIntersecting) {
              const idx = parseInt(indexStr, 10);
              setLazyLoadedPanels((prev) => {
                const updated = [...prev];
                updated[idx] = true;
                return updated;
              });
            }
          });
        },
        {
          root: null,
          threshold: 0.1,
        }
      );
    }
  }, []);

  /******************************************************************************************
   * Step 2: Utility to get the actual active index, whether controlled or unmanaged.
   ******************************************************************************************/
  const currentActiveIndex = isControlled ? (activeIndex as number) : internalActiveIndex;

  /******************************************************************************************
   * Step 3: handleTabClick
   * ----------------------------------------------------------------------------------------
   * Description:
   *   Handles tab selection via mouse or touch input.
   *
   * Parameters:
   *   index: number      -> Which tab was clicked.
   *   event: MouseEvent  -> The mouse or touch event details.
   *
   * Returns: void
   *
   * Steps:
   *   1. Prevent default click behavior.
   *   2. Update internal active state if uncontrolled.
   *   3. Call onChange handler if provided.
   *   4. Set focus on clicked tab.
   ******************************************************************************************/
  const handleTabClick = useCallback(
    (index: number, event: MouseEvent<HTMLDivElement>) => {
      event.preventDefault();
      if (!isControlled) {
        setInternalActiveIndex(index);
      }
      if (onChange) {
        onChange(index);
      }
      if (tabRefs.current[index]) {
        tabRefs.current[index].focus();
      }
    },
    [isControlled, onChange]
  );

  /******************************************************************************************
   * Step 4: handleKeyDown
   * ----------------------------------------------------------------------------------------
   * Description:
   *   Manages keyboard navigation between tabs with enhanced accessibility support.
   *
   * Parameters:
   *   event: KeyboardEvent<HTMLDivElement> -> The keyboard event to interpret.
   *
   * Returns: void
   *
   * Steps:
   *   1. Prevent default browser behavior for arrow keys.
   *   2. Handle ArrowLeft/Right for horizontal navigation.
   *   3. Handle ArrowUp/Down for vertical navigation.
   *   4. Handle Home key to focus first tab.
   *   5. Handle End key to focus last tab.
   *   6. Update active tab state if in uncontrolled mode.
   *   7. Call onChange handler if provided.
   *   8. Set focus on newly active tab.
   *   9. Handle RTL layout direction.
   ******************************************************************************************/
  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      const { key } = event;
      const tabCount = items.length;
      let newIndex = currentActiveIndex;

      // Step 1: Prevent default behavior for arrow keys, Home, and End
      if (
        key === 'ArrowLeft' ||
        key === 'ArrowRight' ||
        key === 'ArrowUp' ||
        key === 'ArrowDown' ||
        key === 'Home' ||
        key === 'End'
      ) {
        event.preventDefault();
      }

      // Step 9: RTL modifies the direction for left/right arrows in horizontal layout
      const horizontalForwardKey = rtl ? 'ArrowLeft' : 'ArrowRight';
      const horizontalBackwardKey = rtl ? 'ArrowRight' : 'ArrowLeft';

      // Step 2 & 3: Handle arrow keys based on orientation
      if (!vertical) {
        if (key === horizontalForwardKey) {
          newIndex = (currentActiveIndex + 1 + tabCount) % tabCount;
        } else if (key === horizontalBackwardKey) {
          newIndex = (currentActiveIndex - 1 + tabCount) % tabCount;
        }
      } else {
        if (key === 'ArrowDown') {
          newIndex = (currentActiveIndex + 1 + tabCount) % tabCount;
        } else if (key === 'ArrowUp') {
          newIndex = (currentActiveIndex - 1 + tabCount) % tabCount;
        }
      }

      // Step 4: Handle Home key
      if (key === 'Home') {
        newIndex = 0;
      }

      // Step 5: Handle End key
      if (key === 'End') {
        newIndex = tabCount - 1;
      }

      // Only update if newIndex differs or if specifically triggered
      if (newIndex !== currentActiveIndex) {
        // Step 6: Update internal state if uncontrolled
        if (!isControlled) {
          setInternalActiveIndex(newIndex);
        }
        // Step 7: Call onChange if provided
        if (onChange) {
          onChange(newIndex);
        }
        // Step 8: Focus newly active tab
        if (tabRefs.current[newIndex]) {
          tabRefs.current[newIndex].focus();
        }
      }
    },
    [currentActiveIndex, isControlled, onChange, items.length, rtl, vertical]
  );

  /******************************************************************************************
   * Step 5: renderTabs
   * ----------------------------------------------------------------------------------------
   * Description:
   *   Renders the complete tab interface with accessibility support, including the tab
   *   list container, each individual tab, and the styling that aligns with the design
   *   system. ARIA attributes are used extensively to ensure compliance.
   *
   * Parameters: None
   * Returns: JSX.Element representing the tabs structure
   *
   * Steps:
   *   1. Render tab list container with role='tablist'.
   *   2. Map through items to create tabs with proper ARIA attributes.
   *   3. Apply active and hover states using design system tokens.
   *   4. Handle RTL layout direction (inline style or CSS).
   *   5. Implement lazy loading for tab panels.
   *   6. Apply proper focus management.
   *   7. Handle animation states as needed.
   ******************************************************************************************/
  const renderTabs = () => {
    return (
      <div
        className={cn(
          // Layout direction (flex row or column) based on vertical prop
          vertical ? 'flex flex-col' : 'flex flex-row',
          // Additional design system classes for spacing/typography
          'gap-1',
          // Custom className if provided
          className
        )}
        style={rtl ? { direction: 'rtl' } : undefined}
        role="tablist"
        aria-orientation={vertical ? 'vertical' : 'horizontal'}
        onKeyDown={handleKeyDown}
      >
        {items.map((label, index) => {
          const isActive = index === currentActiveIndex;
          return (
            <div
              key={label}
              // Step 2: ARIA attributes
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${index}`}
              id={`tab-${index}`}
              tabIndex={isActive ? 0 : -1}
              // Step 3: Apply design system styles for active/hover states
              className={cn(
                'px-4 py-2 text-sm font-medium border-b-2 transition-colors outline-none',
                'focus:ring-2 focus:ring-offset-2',
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-700 hover:text-slate-900'
              )}
              // Step 6: Reference assignment for focus
              ref={(el) => {
                if (el) {
                  tabRefs.current[index] = el;
                }
              }}
              // Step 7: Click handler
              onClick={(event) => handleTabClick(index, event)}
            >
              {label}
            </div>
          );
        })}
      </div>
    );
  };

  /******************************************************************************************
   * Step 6: Attach Intersection Observer to each panel for lazy loading
   * ----------------------------------------------------------------------------------------
   * We attach a ref callback to each panel container. Once the panel is intersecting,
   * we update the lazyLoadedPanels state, ensuring the panel content is loaded.
   ******************************************************************************************/
  const getPanelRefCallback = useCallback(
    (panelEl: HTMLDivElement | null, panelIndex: number) => {
      if (!panelEl || !observer.current) return;
      // Set data attribute to identify this panel
      panelEl.setAttribute('data-panel-index', String(panelIndex));
      // Observe if not already loaded
      if (!lazyLoadedPanels[panelIndex]) {
        observer.current.observe(panelEl);
      }
    },
    [lazyLoadedPanels]
  );

  /******************************************************************************************
   * Step 7: Render Tab Panels
   * ----------------------------------------------------------------------------------------
   * Each panel is wrapped in a div with role='tabpanel' for accessibility. By default,
   * only the active panel is displayed. The intersection observer can trigger loading,
   * but final rendering can also respect currentActiveIndex, ensuring only one panel
   * is truly visible at a time.
   ******************************************************************************************/
  const renderPanels = useMemo(() => {
    // If children is undefined or not an array, handle gracefully
    const contentArray = React.Children.toArray(children);
    return items.map((_, index) => {
      // If the IntersectionObserver hasn't loaded the panel yet, or it's the active tab, we load it
      const shouldRenderContent = lazyLoadedPanels[index] || index === currentActiveIndex;

      // ARIA connection with the tab identified by 'tab-{index}'
      return (
        <div
          key={`panel-${index}`}
          id={`panel-${index}`}
          role="tabpanel"
          aria-labelledby={`tab-${index}`}
          aria-hidden={index !== currentActiveIndex}
          className={cn(index === currentActiveIndex ? 'block' : 'hidden', 'mt-2')}
          ref={(el) => getPanelRefCallback(el, index)}
        >
          {shouldRenderContent && contentArray[index] ? contentArray[index] : null}
        </div>
      );
    });
  }, [children, currentActiveIndex, getPanelRefCallback, items, lazyLoadedPanels]);

  /******************************************************************************************
   * Final JSX Return
   * ----------------------------------------------------------------------------------------
   * We compose the top-level container, the rendered tabs, and the tab panels.
   ******************************************************************************************/
  return (
    <div className="w-full">
      {renderTabs()}
      {renderPanels}
    </div>
  );
};

export default Tabs;