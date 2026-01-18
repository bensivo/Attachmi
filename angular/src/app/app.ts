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

  isModalVisible = false;
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

  selectAttachment(attachment: Attachment) {
    this.selectedAttachment.set(attachment);
  }

  showModal() {
    this.isModalVisible = true;
  }

  handleCancel() {
    this.isModalVisible = false;
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

  handleSubmit() {
    if (!this.newAttachmentName) {
      return;
    }

    const newAttachment: Attachment = {
      id: Math.max(...this.attachments.map(a => a.id), 0) + 1,
      name: this.newAttachmentName,
      date: new Date().toISOString().split('T')[0],
      description: '',
      notes: ''
    };

    this.attachments.push(newAttachment);
    this.handleCancel();
  }

  async onClickButton() {
    const res = await (window as any).electronAPI.sendMessage('Hello from Angular!');
    console.log('Response from Electron:', res);
  }
}
