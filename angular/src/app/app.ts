import { Component, signal, effect } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzUploadModule } from 'ng-zorro-antd/upload';

interface Attachment {
  id: number;
  name: string;
  date: string;
  description: string;
  notes: string;
  fileName?: string;
}

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    FormsModule,
    NzDividerModule,
    NzSplitterModule,
    NzLayoutModule,
    NzListModule,
    NzInputModule,
    NzButtonModule,
    NzModalModule,
    NzUploadModule,
  ],
  templateUrl: './app.html',
  styleUrl: './app.less'
})

export class App {
  protected readonly title = signal('attachmi');
  protected readonly selectedAttachment = signal<Attachment | null>(null);
  protected readonly searchTerm = signal('');
  protected readonly isModalVisible = signal(false);
  protected readonly isEditing = signal(false);
  protected readonly attachments = signal<Attachment[]>([]);

  newAttachmentName = '';
  selectedFile: File | null = null;
  private isInitialized = false;

  constructor() {
    // Load attachments on init
    this.loadAttachments();

    // Auto-save selected attachment changes
    effect(() => {
      const attachment = this.selectedAttachment();
      if (attachment && this.isInitialized && !this.isEditing()) {
        // Save after a small delay to batch rapid changes
        setTimeout(() => this.updateAttachment(attachment), 500);
      }
    });
  }

  private async loadAttachments() {
    try {
      console.log('Loading attachments from database...');
      const loadedAttachments = await (window as any).electronAPI.listAttachments();
      this.attachments.set(loadedAttachments || []);
      console.log(`Loaded ${this.attachments().length} attachments from database:`, this.attachments());
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

  get filteredAttachments(): Attachment[] {
    const search = this.normalizeText(this.searchTerm());
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
    this.isEditing.set(false);
  }

  toggleEdit() {
    this.isEditing.set(!this.isEditing());
  }

  showModal() {
    this.isModalVisible.set(true);
  }

  handleCancel() {
    this.isModalVisible.set(false);
    this.newAttachmentName = '';
    this.selectedFile = null;
  }

  handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      if (!this.newAttachmentName) {
        this.newAttachmentName = this.selectedFile.name;
      }
    }
  }

  async handleSubmit() {
    if (!this.newAttachmentName) {
      return;
    }

    let fileName: string | undefined;

    // If a file was selected, save it to the filesystem
    if (this.selectedFile) {
      fileName = `${Date.now()}_${this.selectedFile.name}`;

      // Convert file to base64
      const reader = new FileReader();
      const fileData = await new Promise<string>((resolve) => {
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.readAsDataURL(this.selectedFile!);
      });

      console.log('Saving file...');

      // Save file via Electron IPC
      const result = await (window as any).electronAPI.saveFile(fileName, fileData);
      if (!result.success) {
        console.error('Failed to save file:', result.error);
        return;
      }

      console.log('File saved successfully:', result.path);
    }

    console.log('After file saved');
    try {
      const newAttachment = await (window as any).electronAPI.createAttachment({
        name: this.newAttachmentName,
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

  async onClickButton() {
    const res = await (window as any).electronAPI.sendMessage('Hello from Angular!');
    console.log('Response from Electron:', res);
  }
}
