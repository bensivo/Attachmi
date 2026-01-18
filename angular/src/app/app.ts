import { Component, signal } from '@angular/core';
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

  newAttachmentName = '';
  selectedFile: File | null = null;

  attachments: Attachment[] = [
    {
      id: 1,
      name: 'Document.pdf',
      date: '2026-01-15',
      description: 'Project proposal document',
      notes: 'Needs review by end of week'
    },
    {
      id: 2,
      name: 'Image.png',
      date: '2026-01-12',
      description: 'Screenshot of dashboard mockup',
      notes: 'Final design approved by client'
    },
    {
      id: 3,
      name: 'Presentation.pptx',
      date: '2026-01-10',
      description: 'Q1 quarterly review presentation',
      notes: 'Used in Monday meeting'
    }
  ];

  get filteredAttachments(): Attachment[] {
    const search = this.normalizeText(this.searchTerm());

    if (!search) {
      return this.attachments;
    }

    return this.attachments.filter(attachment => {
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
    const newAttachment: Attachment = {
      id: Math.max(...this.attachments.map(a => a.id), 0) + 1,
      name: this.newAttachmentName,
      date: new Date().toISOString().split('T')[0],
      description: '',
      notes: '',
      fileName: fileName
    };

    this.attachments.push(newAttachment);
    this.handleCancel();
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
    // Delete file from filesystem if it exists
    if (attachment.fileName) {
      const result = await (window as any).electronAPI.deleteFile(attachment.fileName);
      if (!result.success) {
        console.error('Failed to delete file:', result.error);
        // Continue with array deletion even if file deletion fails
      }
    }

    // Remove from array
    const index = this.attachments.findIndex(a => a.id === attachment.id);
    if (index !== -1) {
      this.attachments.splice(index, 1);
    }

    // Clear selection if this was the selected attachment
    if (this.selectedAttachment()?.id === attachment.id) {
      this.selectedAttachment.set(null);
    }
  }

  async onClickButton() {
    const res = await (window as any).electronAPI.sendMessage('Hello from Angular!');
    console.log('Response from Electron:', res);
  }
}
