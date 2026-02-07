# TypeScript Style Guide

This document describes the TypeScript coding conventions and patterns used in the Attachmi codebase.

## Naming Conventions

### Variables and Functions
- Use **camelCase** for variables, functions, and method names
- Examples: `selectedId`, `filteredAttachments`, `onClickAttachment`, `selectNextAttachment`

### Classes and Interfaces
- Use **PascalCase** for class names and interfaces
- Examples: `App`, `StateService`, `AttachmentsService`, `Attachment`

### Constants
- Use **camelCase** for constants (not SCREAMING_SNAKE_CASE)
- Examples: `appConfig`, `routes`

### Signals
- Use **camelCase** for signal names
- Boolean signals often use `is` prefix: `isInitialized`, `isEditing`, `isDragging`
- Examples: `attachments`, `selectedAttachment`, `attachmentSearchText`

### Files and Folders
- Use **kebab-case** for file names: `attachment-details.component.ts`, `state.service.ts`
- Use **kebab-case** for folder names: `add-attachment-modal`, `attachment-details`
- Angular files use suffixes:
  - Components: `*.component.ts`
  - Services: `*.service.ts`
  - Models: `*.model.ts`
  - Tests: `*.spec.ts`
  - Configuration: `*.config.ts`, `*.routes.ts`

## Comments

### File-Level Comments
- Generally not used in this codebase
- TypeScript files do not have file header comments

### Class/Service Comments
- Use JSDoc-style block comments for class descriptions when the purpose isn't obvious from the name
```typescript
/**
 * Centralized application state management service, currently using just
 * signals as storage containers
 */
@Injectable({
    providedIn: 'root',
})
export class StateService {
```

### Method Comments
- Use JSDoc-style comments for non-trivial methods
- Include `@param` tags for parameter documentation
- Include `@returns` when return value needs explanation
```typescript
/**
 * Upload a new file to the filesystem, then insert it into
 * the electron database, and finally, update the state
 * accordingly.
 *
 * @param file
 * @param name
 * @returns
 */
async createAttachment(file: File, name: string) {
```

### Inline Comments
- Use `//` for brief inline comments explaining non-obvious logic
- Place comments on the line above the code they describe
```typescript
// Edge case, this is the last attachment
if (this.state.filteredAttachments().length == 1) {
    this.selectAttachment(null)
}
```

### Signal Documentation
- Use inline comments to explain groups of related signals
```typescript
// Core signals, whos value directly represents some data
readonly attachments = signal<Attachment[]>([]);

// Derived signals, made using 'computed'
readonly filteredAttachments = computed(() => {
```

## Formatting

### Indentation
- Use **2 spaces** for indentation (not tabs)

### Semicolons
- Semicolons are **required** at the end of statements

### Quotes
- Use **single quotes** for strings (configured via Prettier)
```typescript
import { Component } from '@angular/core';
```

### Print Width
- Maximum line length is **100 characters** (configured via Prettier)

### Trailing Commas
- Use trailing commas in multi-line arrays and objects
```typescript
this.state.attachments.set([
    ...this.state.attachments(),
    newAttachment,
])
```

### Blank Lines
- One blank line between import groups
- One blank line between class members
- No blank line after opening brace of class/function
- One blank line before return statements in longer methods

### Import Organization
- Angular core imports first
- Third-party library imports second
- Local imports last
- No blank lines between imports within a group
```typescript
import { Component, signal, effect, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { AttachmentsService } from './services/attachments.service';
```

## Code Organization

### Source Code Structure
```
angular/src/
  app/
    components/          # UI components
      component-name/
        component-name.component.ts
        component-name.component.html
        component-name.component.less
      index.ts           # Barrel export file
    model/               # Data models/interfaces
      *.model.ts
    services/            # Business logic services
      *.service.ts
    app.ts               # Root component
    app.html             # Root template
    app.less             # Root styles
    app.config.ts        # App configuration
    app.routes.ts        # Routing configuration
    app.spec.ts          # Root component tests
  main.ts                # Application entry point
  index.html             # HTML entry point
  styles.less            # Global styles
```

### Test Files
- Test files are co-located with the code they test
- Use `.spec.ts` suffix
- Currently minimal test coverage (only `app.spec.ts` exists)

## TypeScript-Specific Patterns

### Type Annotations
- Explicit return types on public methods are optional (inferred)
- Use explicit types for complex objects
```typescript
readonly attachments = signal<Attachment[]>([]);
readonly selectedAttachment = signal<Attachment | null>(null);
```

### Strict Mode
The project uses strict TypeScript settings:
- `strict: true`
- `noImplicitReturns: true`
- `noFallthroughCasesInSwitch: true`
- `noImplicitOverride: true`
- `noPropertyAccessFromIndexSignature: true`

### Type Casting
- Use `as` for type assertions
```typescript
const input = event.target as HTMLInputElement;
```

### Non-null Assertions
- Use `!` sparingly when you know a value won't be null
```typescript
[(ngModel)]="attachment()!.name"
```

### Access Modifiers
- Use `private` for internal service dependencies
- Use `protected` for class members used in templates
- Use `readonly` for signals that shouldn't be reassigned
```typescript
private state = inject(StateService);
protected readonly title = signal('attachmi');
readonly attachments = signal<Attachment[]>([]);
```

### Interfaces vs Types
- Prefer `interface` for data models
- Use `export interface` for shared types
```typescript
export interface Attachment {
  id: number;
  name: string;
  date: string;
  description: string;
  notes: string;
  fileName?: string;
}
```

### Async/Await
- Prefer `async/await` over raw Promises for readability
```typescript
async createAttachment(file: File, name: string) {
    const result = await (window as any).electronAPI.saveFile(fileName, fileData);
}
```

### Error Handling
- Use try/catch with console.error for error logging
- Don't throw errors to callers; handle them locally
```typescript
try {
    const loadedAttachments = await (window as any).electronAPI.listAttachments();
    this.state.attachments.set(loadedAttachments || []);
} catch (error) {
    console.error('Failed to load attachments:', error);
    this.state.attachments.set([]);
}
```
