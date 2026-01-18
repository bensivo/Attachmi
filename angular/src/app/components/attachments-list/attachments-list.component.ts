import { Component, input, output } from '@angular/core';
import { NzListModule } from 'ng-zorro-antd/list';

export interface Attachment {
  id: number;
  name: string;
  date: string;
  description: string;
  notes: string;
  fileName?: string;
}

@Component({
  selector: 'app-attachments-list',
  standalone: true,
  imports: [NzListModule],
  templateUrl: './attachments-list.component.html',
  styleUrl: './attachments-list.component.less'
})
export class AttachmentsListComponent {
  attachments = input.required<Attachment[]>();
  selectedId = input<number | null>(null);
  selectAttachment = output<Attachment>();

  onSelect(attachment: Attachment) {
    this.selectAttachment.emit(attachment);
  }
}
