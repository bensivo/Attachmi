# Less Style Guide

This document describes the Less/CSS conventions and patterns used in the Attachmi codebase.

## File Organization

### Global Styles
- `src/styles.less` - Global styles and theme imports
- Imports the ng-zorro-antd theme:
```less
@import "../node_modules/ng-zorro-antd/ng-zorro-antd.less";
```

### Component Styles
- Each component has a co-located `.less` file
- Component styles are scoped to that component
- File naming: `component-name.component.less`

### File Structure
```
angular/src/
  styles.less                              # Global styles
  app/
    app.less                               # Root component styles
    components/
      header/
        header.component.less
      attachments-list/
        attachments-list.component.less
      attachment-details/
        attachment-details.component.less
      add-attachment-modal/
        add-attachment-modal.component.less
```

## Naming Conventions

### Class Names
- Use **kebab-case** for class names
- Examples: `header-content`, `search-container`, `attachment-list-item`, `detail-section`

### Semantic Names
- Use descriptive, purpose-based names
- Layout classes: `layout-left`, `layout-right`, `site-layout-content`
- Container classes: `search-container`, `btn-container`, `header-content`
- State classes: `active`, `drag-over`, `empty-state`

### BEM-like Patterns
The codebase uses a loose BEM-inspired approach (not strict BEM):
```less
.attachment-details {
  .details-header {
    .name-input { }
    .action-buttons { }
  }
  .detail-section {
    label { }
    p { }
  }
}
```

### Element Selectors
- Direct element selectors are used within component context
- Examples: `h2`, `label`, `p`, `input`, `textarea`

## Nesting

### Standard Pattern
Use Less nesting to scope styles:
```less
.attachment-details {
  .details-header {
    display: flex;
    justify-content: space-between;

    h2 {
      margin: 0;
    }
  }
}
```

### Nesting Depth
- Generally 2-4 levels deep
- Deepest nesting observed: 4 levels

### Parent Reference (&)
Use `&` for state modifiers and pseudo-selectors:
```less
.attachment-list-item {
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #f5f5f5;
  }

  &.active {
    background-color: #e6f4ff;
    border-left: 3px solid #1890ff;
  }
}
```

## Formatting

### Indentation
- Use **2 spaces** for indentation

### Braces
- Opening brace on same line as selector
- Closing brace on its own line
```less
.class-name {
  property: value;
}
```

### Property Format
- One property per line
- Colon followed by space
- Semicolon at end of each declaration
```less
.element {
  display: flex;
  align-items: center;
  padding: 0 24px;
}
```

### Blank Lines
- No blank lines between properties
- Blank line between rule sets
- Blank line before nested selectors (optional, inconsistent in codebase)

## Comments

### Style
- Use `//` for single-line comments (Less style)
- Use `/* */` for multi-line or important comments
```less
// Disable dragging here, so the input can be clicked on
-webkit-app-region: no-drag;

/* You can add global styles to this file, and also import other style files */
```

### Documentation Comments
- Minimal usage; comments explain non-obvious behavior
- Reference external documentation for theme variables:
```less
// Override less variables to here
// View all variables: https://github.com/NG-ZORRO/ng-zorro-antd/blob/master/components/style/themes/default.less
```

## Units and Values

### Spacing
- Use `px` for spacing values: `24px`, `8px`, `12px`
- Common spacing values: `4px`, `8px`, `12px`, `16px`, `20px`, `24px`, `32px`, `48px`, `64px`

### Colors
- Use hex colors: `#fff`, `#1890ff`, `#262626`, `#595959`, `#f5f5f5`
- Use `rgba()` for transparent colors: `rgba(0, 0, 0, 0.09)`, `rgba(24, 144, 255, 0.1)`
- Primary brand color: `#1890ff` (Ant Design blue)

### Font Sizes
- Use `px` for font sizes: `14px`, `16px`, `18px`, `24px`
- Use `em` for relative sizing: `0.75em`

### Border Radius
- Standard values: `4px`, `8px`, `12px`

### Z-Index
- High values for overlays: `1000`

## Layout Patterns

### Flexbox
Flexbox is the primary layout method:
```less
.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
}
```

### Flex Properties
- `flex: 1` and `flex: 9` for proportional sizing
- `flex-grow: 1` for expanding elements
- `gap` for spacing between flex items

### Full-Height Containers
```less
nz-layout {
    height: 100vh;
}

.layout-right {
    height: 100%;
    overflow-y: auto;
}
```

## Component Styling Patterns

### ng-zorro Component Overrides
Style ng-zorro components using their element selectors:
```less
nz-header {
  display: flex;
  align-items: center;
  padding: 0 24px;
}

nz-content {
  flex-grow: 1;
  margin: 24px;
}
```

### Form Styling
```less
.form-field {
  margin-bottom: 20px;

  label {
    display: block;
    font-weight: 600;
    color: #595959;
    margin-bottom: 8px;
    font-size: 14px;
  }

  input[type="text"] {
    width: 100%;
  }
}
```

### State Modifiers
```less
&.active {
  background-color: #e6f4ff;
  border-left: 3px solid #1890ff;
}

&:hover {
  background-color: #f5f5f5;
}
```

## Electron-Specific Styles

### Window Dragging
For frameless windows, control draggable regions:
```less
nz-header {
  -webkit-app-region: drag;
}

.search-container {
  -webkit-app-region: no-drag;  // Allow clicking on interactive elements
}
```

## Transitions and Animations

### Simple Transitions
```less
transition: background-color 0.2s;
transition: opacity 0.2s ease;
```

### Common Easing
- Default: `ease`
- Duration: `0.2s` for quick transitions

## Box Shadows

### Card Shadows
```less
box-shadow: 0 2px 8px rgba(0, 0, 0, 0.09);
```

### Modal Shadows
```less
box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
```

## Overlay Patterns

### Full-Screen Overlay
```less
.drop-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  opacity: 0;
  pointer-events: none;
  z-index: 1000;

  // Activation via parent class
}
```

### Backdrop Filter
```less
backdrop-filter: blur(4px);
```

## Theme Variables

### Ant Design Variables
The project can override Ant Design theme variables in `styles.less`:
```less
// @primary-color: #1890ff;  // Currently commented out, using default
```

Refer to ng-zorro documentation for available variables.

## Color Palette

### Brand Colors
- Primary: `#1890ff`
- Primary hover: `#40a9ff`
- Primary light: `#e6f4ff`

### Grays
- White: `#fff`
- Light gray: `#f5f5f5`
- Border gray: `#d9d9d9`, `#f0f0f0`
- Text secondary: `#595959`, `#8c8c8c`
- Text primary: `#262626`

### State Colors
- Hover background: `#f5f5f5`
- Active/selected: `#e6f4ff`
- Danger: Uses ng-zorro's `nzDanger` attribute
