/**
 * Axe-core accessibility testing setup (Story 8.3 - AC6)
 * WCAG 2.1 Level AA Compliance Testing
 *
 * Runs in development mode only
 * Logs accessibility violations to console
 *
 * @see https://github.com/dequelabs/axe-core-npm/tree/develop/packages/react
 */

import React from 'react';
import ReactDOM from 'react-dom';

if (import.meta.env.DEV) {
  import('@axe-core/react')
    .then((axe) => {
      axe.default(React, ReactDOM, 1000, {
        // Story 8.3: Full WCAG 2.1 AA compliance rules
        runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'],
        rules: [
          // Core WCAG rules (all enabled for Sprint 8)
          { id: 'label', enabled: true }, // Forms must have labels (UX-P1-004)
          { id: 'button-name', enabled: true }, // Buttons must have accessible names
          { id: 'link-name', enabled: true }, // Links must have accessible names
          { id: 'aria-required-attr', enabled: true }, // Required ARIA attributes
          { id: 'aria-valid-attr', enabled: true }, // Valid ARIA attributes
          { id: 'aria-valid-attr-value', enabled: true }, // Valid ARIA values
          { id: 'input-image-alt', enabled: true }, // Image inputs need alt text
          { id: 'form-field-multiple-labels', enabled: true }, // One label per field

          // Sprint 8: Enable previously deferred rules
          { id: 'color-contrast', enabled: true }, // AC3: Color contrast 4.5:1 (UX-P1-007)
          { id: 'focus-order-semantics', enabled: true }, // AC1: Focus order

          // Sprint 8: Enable landmark and heading rules
          { id: 'region', enabled: true }, // AC2: Landmark regions
          { id: 'page-has-heading-one', enabled: true }, // AC2: H1 requirement
          { id: 'heading-order', enabled: true }, // AC2: Heading hierarchy
          { id: 'landmark-one-main', enabled: true }, // AC5: Main landmark
          { id: 'bypass', enabled: true }, // AC5: Skip links

          // Keyboard accessibility (AC1)
          { id: 'tabindex', enabled: true }, // Proper tabindex usage
          { id: 'focus-trap', enabled: true }, // Modal focus trap

          // Screen reader support (AC2)
          { id: 'aria-hidden-focus', enabled: true }, // No focus on hidden elements
          { id: 'aria-input-field-name', enabled: true }, // Input fields named
        ],
      });
      console.log('🔍 Axe accessibility testing enabled - WCAG 2.1 AA (Story 8.3)');
    })
    .catch((err) => {
      console.warn('⚠️ Could not load @axe-core/react:', err);
    });
}

export default {}; // Export for module system
