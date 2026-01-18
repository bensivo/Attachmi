import { Component, input, output, effect } from '@angular/core';
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

  constructor() {
    // Auto-scroll to selected item when it changes
    effect(() => {
      const id = this.selectedId();
      if (id !== null) {
        // Small delay to ensure DOM is updated
        setTimeout(() => {
          const selectedElement = document.querySelector(
            `.attachment-list-item[data-id="${id}"]`
          ) as HTMLElement;

          if (selectedElement) {
            selectedElement.scrollIntoView({
              behavior: 'smooth',
              block: 'nearest'
            });
          }
        }, 0);
      }
    });
  }

  onSelect(attachment: Attachment) {
    this.selectAttachment.emit(attachment);
  }
}
