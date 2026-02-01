import { Component, signal, effect, viewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import {
  HeaderComponent,
  AttachmentsListComponent,
  AttachmentDetailsComponent,
  AddAttachmentModalComponent,
  Attachment
} from './components';
import { AttachmentsService } from './services/attachments.service';
import { StateService } from './services/state.service';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    NzLayoutModule,
    NzSplitterModule,
    HeaderComponent,
    AttachmentsListComponent,
    AttachmentDetailsComponent,
    AddAttachmentModalComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.less'
})

export class App {
  protected readonly title = signal('attachmi');

  // Global state signals for specific application components
  protected readonly isAddAttachmentModelVisible = signal(false);
  protected readonly isEditingAttachmentDetails = signal(false);
  protected readonly newAttachmentName = signal('');
  protected readonly newAttachmentFileName = signal('');
  protected readonly isDragging = signal(false);
  protected readonly droppedFile = signal<File | null>(null);

  // Reference to header component for focusing on the searchbar
  private headerComponent = viewChild(HeaderComponent);

  // Reference to attachment details component for focusing inputs
  private attachmentDetailsComponent = viewChild(AttachmentDetailsComponent);

  constructor(
    private state: StateService,
    private attachmentsService: AttachmentsService,
  ) {
    // Load attachments on init
    this.attachmentsService.loadAttachments()

    // Auto-save selected attachment changes
    effect(() => {
      const attachment = this.state.selectedAttachment();
      if (attachment && this.state.isInitialized() && !this.isEditingAttachmentDetails()) {
        // Save after a small delay to batch rapid changes
        setTimeout(() => this.attachmentsService.updateAttachment(attachment), 500);
      }
    });
  }

  get filteredAttachments() {
    return this.state.filteredAttachments();
  }

  selectAttachment(attachment: Attachment) {
    this.state.selectedAttachment.set(attachment);
    this.isEditingAttachmentDetails.set(false);
  }

  toggleEdit() {
    const wasEditing = this.isEditingAttachmentDetails();
    this.isEditingAttachmentDetails.set(!wasEditing);

    // Focus the title input when entering edit mode
    if (!wasEditing) {
      this.attachmentDetailsComponent()?.focusTitleInput();
    }
  }

  showModal() {
    this.isAddAttachmentModelVisible.set(true);
  }

  handleCancel() {
    this.isAddAttachmentModelVisible.set(false);
    this.newAttachmentName.set('');
    this.newAttachmentFileName.set('');
    this.droppedFile.set(null);
  }

  onDragAndDropFileOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragAndDropFileLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();

    // Only set isDragging to false if we're leaving the nz-layout element
    // This prevents flickering when dragging over child elements
    if (event.target === event.currentTarget) {
      this.isDragging.set(false);
    }
  }

  async onDragAndDropFileSubmit(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);

    const files = event.dataTransfer?.files;
    if (!files) {
      return;
    }

    for(const file of files) {
      this.attachmentsService.createAttachment(file, file.name)
    }
  }

  async onSubmitNewAttachmentForm(file: File | null) {
    if (!this.newAttachmentName()) {
      return;
    }

    if (!file) {
      return;
    }

    await this.attachmentsService.createAttachment(file, this.newAttachmentName())

    this.isAddAttachmentModelVisible.set(false);
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    // CMD+F (Mac) or Ctrl+F (Windows/Linux) - Focus search
    if ((event.metaKey || event.ctrlKey) && event.key === 'f') {
      event.preventDefault();
      this.headerComponent()?.focusSearchInput();
    }

    // CMD+N (Mac) or Ctrl+N (Windows/Linux) - Open add attachment modal
    if ((event.metaKey || event.ctrlKey) && event.key === 'n') {
      event.preventDefault();
      this.showModal();
    }

    // CMD+J (Mac) or Ctrl+J (Windows/Linux) - Select next attachment
    if ((event.metaKey || event.ctrlKey) && event.key === 'j') {
      event.preventDefault();
      this.attachmentsService.selectNextAttachment();
    }

    // CMD+K (Mac) or Ctrl+K (Windows/Linux) - Select previous attachment
    if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
      event.preventDefault();
      this.attachmentsService.selectPreviousAttachment();
    }

    // CMD+O (Mac) or Ctrl+O (Windows/Linux) - Open file if detail page is active
    if ((event.metaKey || event.ctrlKey) && event.key === 'o') {
      event.preventDefault();
      const attachment = this.state.selectedAttachment();
      if (attachment && attachment.fileName) {
        this.attachmentsService.openAttachment(attachment);
      }
    }

    // CMD+E (Mac) or Ctrl+E (Windows/Linux) - Toggle edit mode
    if ((event.metaKey || event.ctrlKey) && event.key === 'e') {
      event.preventDefault();
      if (this.state.selectedAttachment()) {
        this.toggleEdit();
      }
    }

    // CMD+S (Mac) or Ctrl+S (Windows/Linux) - Save (exit edit mode)
    if ((event.metaKey || event.ctrlKey) && event.key === 's') {
      event.preventDefault();
      if (this.state.selectedAttachment() && this.isEditingAttachmentDetails()) {
        this.toggleEdit();
      }
    }

    // CMD+P (Mac) or Ctrl+P (Windows/Linux) - Download file
    if ((event.metaKey || event.ctrlKey) && event.key === 'p') {
      event.preventDefault();
      const attachment = this.state.selectedAttachment();
      if (attachment && attachment.fileName) {
        this.attachmentsService.downloadAttachment(attachment);
      }
    }

    // CMD+D (Mac) or Ctrl+D (Windows/Linux) - Delete File
    if ((event.metaKey || event.ctrlKey) && event.key === 'd') {
      event.preventDefault();
      const attachment = this.state.selectedAttachment();
      if (attachment) {
        this.attachmentsService.deleteAttachment(attachment);
      }
    }
  }

}
