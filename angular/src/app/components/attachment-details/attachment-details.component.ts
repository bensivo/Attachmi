import { Component, input, output, model, viewChild, ElementRef, inject, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { Attachment } from '../attachments-list/attachments-list.component';
import { StateService } from '../../services/state.service';
import { AttachmentsService } from '../../services/attachments.service';

@Component({
  selector: 'app-attachment-details',
  standalone: true,
  imports: [
    FormsModule,
    NzInputModule,
    NzButtonModule
  ],
  templateUrl: './attachment-details.component.html',
  styleUrl: './attachment-details.component.less'
})
export class AttachmentDetailsComponent {
  private state = inject(StateService);
  private attachmentsService = inject(AttachmentsService);

  attachment = this.state.selectedAttachment;

  isEditing = model.required<boolean>();
  toggleEdit = output<void>();


  // Reference to the title input field
  private titleInput = viewChild<ElementRef>('titleInput');

  onToggleEdit() {
    this.toggleEdit.emit();
  }

  onClickDeleteFile() {
    const attachment = this.attachment();
    if (!attachment) {
      return;
    }

    this.attachmentsService.deleteAttachment(attachment)
  }

  ononClickOpenFile() {
    const attachment = this.attachment();
    if (!attachment) {
      return;
    }

    this.attachmentsService.openAttachment(attachment)
  }

  ononClickDownloadFile() {
    const attachment = this.attachment();
    if (!attachment) {
      return;
    }

    this.attachmentsService.downloadAttachment(attachment)
  }

  focusTitleInput() {
    setTimeout(() => {
      this.titleInput()?.nativeElement.focus();
    }, 0);
  }
}
