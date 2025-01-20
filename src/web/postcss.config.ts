/**
 * PostCSS configuration file for the B2B sales intelligence platform.
 * Integrates Tailwind CSS (3.3.0) for implementing the design system and 
 * Autoprefixer (10.4.0) for vendor prefix management and CSS compatibility.
 * 
 * This configuration addresses:
 *  - Design system integration via Tailwind CSS utilities (3.1 USER INTERFACE DESIGN).
 *  - PostCSS pipeline optimizations for performance and automated prefixing (4.2 FRAMEWORKS & LIBRARIES).
 * 
 * The order of plugins (Tailwind CSS first, then Autoprefixer) ensures 
 * that utility-first transformations are handled prior to applying vendor prefixes.
 */

// Importing Tailwind CSS - version 3.3.0
import tailwindcss from 'tailwindcss' // tailwindcss v3.3.0

// Importing Autoprefixer - version 10.4.0
import autoprefixer from 'autoprefixer' // autoprefixer v10.4.0

/**
 * Default export: PostCSS configuration object.
 * An array of plugins is defined here to complete the CSS processing pipeline.
 */
export default {
  plugins: [
    /**
     * Tailwind CSS plugin for utility-first design system integration.
     */
    tailwindcss,
    /**
     * Autoprefixer plugin for automatically adding vendor prefixes.
     */
    autoprefixer,
  ],
}