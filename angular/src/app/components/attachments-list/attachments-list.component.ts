import { Component, input, output, effect, inject, computed } from '@angular/core';
import { NzListModule } from 'ng-zorro-antd/list';
import { StateService } from '../../services/state.service';
import { AttachmentsService } from '../../services/attachments.service';

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
  private state = inject(StateService);
  private attachmentsService = inject(AttachmentsService);

  attachments = this.state.filteredAttachments;

  selectedId = computed(() => {
    const selectedAttachment = this.state.selectedAttachment();
    if (selectedAttachment) {
      return selectedAttachment.id;
    } else {
      return null;
    }
  })

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

  onClickAttachment(attachment: Attachment) {
    this.attachmentsService.selectAttachment(attachment);
  }
}
