import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';

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
    NzDividerModule,
    NzSplitterModule,
    NzLayoutModule,
    NzListModule,
  ],
  templateUrl: './app.html',
  styleUrl: './app.less'
})

export class App {
  protected readonly title = signal('attachmi');
  protected readonly selectedAttachment = signal<Attachment | null>(null);

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

  async onClickButton() {
    const res = await (window as any).electronAPI.sendMessage('Hello from Angular!');
    console.log('Response from Electron:', res);
  }
}
