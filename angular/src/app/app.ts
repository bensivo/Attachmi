import { Component, signal, effect, viewChild, HostListener } from '@angular/core';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import {
  HeaderComponent,
  AttachmentsListComponent,
  AttachmentDetailsComponent,
  AddAttachmentModalComponent,
  Attachment
} from './components';

@Component({
  selector: 'app-root',
  imports: [
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
  protected readonly attachmentSearchText = signal('');
  protected readonly isAddAttachmentModelVisible = signal(false);
  protected readonly isEditingAttachmentDetails = signal(false);
  protected readonly newAttachmentName = signal('');
  protected readonly newAttachmentFileName = signal('');

  // Global application data signals
  protected readonly attachments = signal<Attachment[]>([]);
  protected readonly selectedAttachment = signal<Attachment | null>(null);

  // False when app loads, True once initial data has been loaded in from backend
  private isInitialized = false;

  // Reference to header component for keyboard shortcuts
  private headerComponent = viewChild(HeaderComponent);

  constructor() {
    // Load attachments on init
    this.loadAttachments();

    // Auto-save selected attachment changes
    effect(() => {
      const attachment = this.selectedAttachment();
      if (attachment && this.isInitialized && !this.isEditingAttachmentDetails()) {
        // Save after a small delay to batch rapid changes
        setTimeout(() => this.updateAttachment(attachment), 500);
      }
    });
  }

  private async loadAttachments() {
    try {
      const loadedAttachments = await (window as any).electronAPI.listAttachments();
      this.attachments.set(loadedAttachments || []);
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to load attachments:', error);
      this.attachments.set([]);
      this.isInitialized = true;
    }
  }

  private async updateAttachment(attachment: Attachment) {
    try {
      await (window as any).electronAPI.updateAttachment(attachment);
    } catch (error) {
      console.error('Failed to update attachment:', error);
    }
  }

  /**
   * Returns the list of attachments, properly filtered
   * based on the current search text. 
   */
  get filteredAttachments(): Attachment[] {
    const search = this.normalizeText(this.attachmentSearchText());
    const currentAttachments = this.attachments();

    if (!search) {
      return currentAttachments;
    }

    return currentAttachments.filter(attachment => {
      const name = this.normalizeText(attachment.name);
      const description = this.normalizeText(attachment.description);
      const notes = this.normalizeText(attachment.notes);

      return name.includes(search) ||
             description.includes(search) ||
             notes.includes(search);
    });
  }

  private normalizeText(text: string): string {
    return text.toLowerCase().replace(/[^\w\s]/g, '');
  }

  selectAttachment(attachment: Attachment) {
    this.selectedAttachment.set(attachment);
    this.isEditingAttachmentDetails.set(false);
  }

  toggleEdit() {
    this.isEditingAttachmentDetails.set(!this.isEditingAttachmentDetails());
  }

  showModal() {
    this.isAddAttachmentModelVisible.set(true);
  }

  handleCancel() {
    this.isAddAttachmentModelVisible.set(false);
    this.newAttachmentName.set('');
    this.newAttachmentFileName.set('');
  }

  async handleSubmit(file: File | null) {
    if (!this.newAttachmentName()) {
      return;
    }

    let fileName: string | undefined;

    // If a file was selected, save it to the filesystem
    if (file) {
      fileName = `${Date.now()}_${file.name}`;

      // Convert file to base64
      const reader = new FileReader();
      const fileData = await new Promise<string>((resolve) => {
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.readAsDataURL(file);
      });


      // Save file via Electron IPC
      const result = await (window as any).electronAPI.saveFile(fileName, fileData);
      if (!result.success) {
        console.error('Failed to save file:', result.error);
        return;
      }
    }

    try {
      const newAttachment = await (window as any).electronAPI.createAttachment({
        name: this.newAttachmentName(),
        date: new Date().toISOString().split('T')[0],
        description: '',
        notes: '',
        fileName: fileName
      });

      this.attachments.update(attachments => [...attachments, newAttachment]);
      this.handleCancel();
    } catch (error) {
      console.error('Failed to create attachment:', error);
    }
  }

  async openFile(attachment: Attachment) {
    if (!attachment.fileName) {
      console.log('No file associated with this attachment');
      return;
    }

    const result = await (window as any).electronAPI.openFile(attachment.fileName);
    if (!result.success) {
      console.error('Failed to open file:', result.error);
    }
  }

  async deleteAttachment(attachment: Attachment) {
    try {
      // Delete file from filesystem if it exists
      if (attachment.fileName) {
        const result = await (window as any).electronAPI.deleteFile(attachment.fileName);
        if (!result.success) {
          console.error('Failed to delete file:', result.error);
          // Continue with database deletion even if file deletion fails
        }
      }

      // Delete from database
      await (window as any).electronAPI.deleteAttachment(attachment.id);

      // Remove from array
      this.attachments.update(attachments =>
        attachments.filter(a => a.id !== attachment.id)
      );

      // Clear selection if this was the selected attachment
      if (this.selectedAttachment()?.id === attachment.id) {
        this.selectedAttachment.set(null);
      }
    } catch (error) {
      console.error('Failed to delete attachment:', error);
    }
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
  }
}
