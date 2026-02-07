# Angular Style Guide

This document describes the Angular-specific conventions and patterns used in the Attachmi codebase. For general TypeScript patterns, see `typescript-style-guide.md`.

## Angular Version and Features

The project uses **Angular 21** with modern features:
- Standalone components (no NgModules)
- Signals for reactive state management
- New control flow syntax (`@if`, `@for`, `@else`)
- `inject()` function for dependency injection

## Component Architecture

### File Organization
Each component has its own folder with co-located files:
```
components/
  component-name/
    component-name.component.ts      # Component class
    component-name.component.html    # Template (templateUrl)
    component-name.component.less    # Styles (styleUrl)
```

### Component Declaration Pattern
```typescript
@Component({
  selector: 'app-component-name',
  standalone: true,                    // All components are standalone
  imports: [                           // Import dependencies directly
    FormsModule,
    NzInputModule,
    NzButtonModule
  ],
  templateUrl: './component-name.component.html',
  styleUrl: './component-name.component.less'   // Note: styleUrl (singular)
})
export class ComponentNameComponent {
```

### Root Component
- The root component is named `App` (not `AppComponent`)
- Located at `src/app/app.ts` (not `app.component.ts`)
- Uses `app.html` and `app.less` (without `.component` suffix)

### Component Selectors
- Use `app-` prefix for all components
- Use kebab-case: `app-header`, `app-attachments-list`, `app-attachment-details`

## State Management

### Signals Pattern
The project uses Angular Signals for state management with a centralized `StateService`:

```typescript
@Injectable({
    providedIn: 'root',
})
export class StateService {
    // Core signals - raw state
    readonly attachments = signal<Attachment[]>([]);
    readonly selectedAttachment = signal<Attachment | null>(null);

    // Derived signals - computed from core signals
    readonly filteredAttachments = computed(() => {
        // computation logic
    });
}
```

### Signal Usage in Components
```typescript
// Injecting state service
private state = inject(StateService);

// Exposing signals to template
attachment = this.state.selectedAttachment;

// Reading signal value
const attachment = this.state.selectedAttachment();

// Setting signal value
this.state.attachments.set([...this.state.attachments(), newAttachment]);

// Updating signal value
this.state.attachments.update(attachments =>
    attachments.filter(a => a.id !== attachment.id)
);
```

### Local Component State
Components may have local signals for UI-specific state:
```typescript
protected readonly isAddAttachmentModelVisible = signal(false);
protected readonly isDragging = signal(false);
```

## Dependency Injection

### Two Patterns Used
The codebase uses both patterns (inconsistent):

**1. Constructor injection:**
```typescript
constructor(
    private state: StateService,
) { }
```

**2. inject() function:**
```typescript
private state = inject(StateService);
private attachmentsService = inject(AttachmentsService);
```

### Service Registration
All services use `providedIn: 'root'`:
```typescript
@Injectable({
    providedIn: 'root',
})
export class AttachmentsService {
```

## Input/Output Patterns

### Modern Input API
```typescript
// Required input
title = input.required<string>();

// Optional input with default
droppedFile = input<File | null>(null);
```

### Output Events
```typescript
addAttachment = output<void>();
submit = output<File | null>();
```

### Two-Way Binding with model()
```typescript
// In component
isEditing = model.required<boolean>();
visible = model.required<boolean>();

// In template
[(isEditing)]="isEditingAttachmentDetails"
[(visible)]="isAddAttachmentModelVisible"
```

### viewChild Pattern
```typescript
private headerComponent = viewChild(HeaderComponent);
private titleInput = viewChild<ElementRef>('titleInput');
searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');
```

## Template Patterns

### Control Flow Syntax
Use the new `@if`/`@for`/`@else` syntax (not `*ngIf`/`*ngFor`):

```html
@if (attachment()) {
  <div class="attachment-details">
    <!-- content -->
  </div>
} @else {
  <div class="empty-state">
    <p>Select an attachment to view details</p>
  </div>
}

@for (item of attachments(); track item.id) {
  <nz-list-item>
    <!-- content -->
  </nz-list-item>
}
```

### Exception: *ngIf Directive
The `*ngIf` directive is still used in some places:
```html
<div class="drop-overlay" *ngIf="isDragging()">
```

### Signal Reading in Templates
Always call signals as functions in templates:
```html
[title]="title()"
[class.active]="selectedId() === item.id"
{{ attachment()!.name }}
```

### Event Binding
```html
(click)="onClickAttachment(item)"
(addAttachment)="showModal()"
(drop)="onDragAndDropFileSubmit($event)"
```

### Two-Way Binding
```html
[(ngModel)]="searchText"
[(isEditing)]="isEditingAttachmentDetails"
```

### Self-Closing Component Tags
Use self-closing tags for components without content:
```html
<app-header
  [title]="title()"
  (addAttachment)="showModal()"
/>
<app-attachments-list/>
```

## Effects Pattern

Use `effect()` for side effects based on signal changes:

```typescript
constructor() {
    // Auto-save selected attachment changes
    effect(() => {
        const attachment = this.state.selectedAttachment();
        if (attachment && this.state.isInitialized()) {
            setTimeout(() => this.attachmentsService.updateAttachment(attachment), 500);
        }
    });
}
```

## Keyboard Shortcuts

Use `@HostListener` for global keyboard shortcuts:
```typescript
@HostListener('window:keydown', ['$event'])
handleKeyboardEvent(event: KeyboardEvent) {
    if ((event.metaKey || event.ctrlKey) && event.key === 'f') {
        event.preventDefault();
        this.headerComponent()?.focusSearchInput();
    }
}
```

## NG-ZORRO Components

The project uses **ng-zorro-antd** (Ant Design for Angular) as the UI component library:
- Import modules directly in component imports array
- Examples: `NzLayoutModule`, `NzInputModule`, `NzButtonModule`, `NzModalModule`, `NzListModule`, `NzSplitterModule`

```typescript
imports: [
    FormsModule,
    NzLayoutModule,
    NzInputModule,
    NzButtonModule
],
```

## Barrel Exports

Use `index.ts` files to create barrel exports for component directories:
```typescript
// components/index.ts
export { HeaderComponent } from './header/header.component';
export { AttachmentsListComponent } from './attachments-list/attachments-list.component';
export type { Attachment } from './attachments-list/attachments-list.component';
export { AttachmentDetailsComponent } from './attachment-details/attachment-details.component';
```

## Forms

### FormsModule Usage
Use `FormsModule` with `ngModel` for simple forms (not Reactive Forms):
```html
<input
  nz-input
  type="text"
  [(ngModel)]="searchText"
/>
```

### Form Event Handling
```html
<form class="modal-form" (submit)="$event.preventDefault; onSubmit()">
  <input
    (keydown.enter)="onSubmit(); $event.preventDefault()"
  />
</form>
```

## Method Naming Conventions

### Event Handlers
- Prefix with `on`: `onClickAttachment`, `onToggleEdit`, `onFileSelect`, `onCancel`, `onSubmit`
- Drag events: `onDragAndDropFileOver`, `onDragAndDropFileLeave`, `onDragAndDropFileSubmit`

### Actions
- Use verb prefixes: `showModal`, `handleCancel`, `toggleEdit`, `focusSearchInput`

### Service Methods
- CRUD operations: `createAttachment`, `loadAttachments`, `updateAttachment`, `deleteAttachment`
- Selection: `selectAttachment`, `selectNextAttachment`, `selectPreviousAttachment`

## Routing

The application currently has no routes configured (single-page app):
```typescript
export const routes: Routes = [];
```

Routing is set up via `provideRouter(routes)` in the app config.

## Testing

- Uses **Vitest** as the test runner (not Jasmine/Karma)
- Test files use `.spec.ts` suffix
- Uses Angular's `TestBed` for component testing
```typescript
import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
});
```
