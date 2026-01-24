import { Component, input, output, model, viewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { Attachment } from '../attachments-list/attachments-list.component';

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
  attachment = input<Attachment | null>(null);
  isEditing = model.required<boolean>();
  toggleEdit = output<void>();
  deleteAttachment = output<void>();
  openFile = output<void>();
  downloadFile = output<void>();

  // Reference to the title input field
  private titleInput = viewChild<ElementRef>('titleInput');

  onToggleEdit() {
    this.toggleEdit.emit();
  }

  onDelete() {
    this.deleteAttachment.emit();
  }

  onOpenFile() {
    this.openFile.emit();
  }

  onDownloadFile() {
    this.downloadFile.emit();
  }

  focusTitleInput() {
    setTimeout(() => {
      this.titleInput()?.nativeElement.focus();
    }, 0);
  }
}
