import { Component, input, output, model, viewChild, ElementRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { Attachment } from '../attachments-list/attachments-list.component';

@Component({
  selector: 'app-attachment-details',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzInputModule,
    NzButtonModule,
    NzSelectModule,
    NzTagModule
  ],
  templateUrl: './attachment-details.component.html',
  styleUrl: './attachment-details.component.less'
})
export class AttachmentDetailsComponent {
  attachment = input<Attachment | null>(null);
  isEditing = model.required<boolean>();
  attachmentCollections = input<{ id: number; name: string }[]>([]);
  availableCollections = input<{ id: number; name: string; count: number }[]>([]);
  toggleEdit = output<void>();
  deleteAttachment = output<void>();
  openFile = output<void>();
  downloadFile = output<void>();
  addToCollection = output<number>();
  removeFromCollection = output<number>();

  protected selectedCollectionId = signal<number | null>(null);

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

  onAddToCollection() {
    const collectionId = this.selectedCollectionId();
    if (collectionId) {
      this.addToCollection.emit(collectionId);
      this.selectedCollectionId.set(null);
    }
  }

  onRemoveFromCollection(collectionId: number) {
    this.removeFromCollection.emit(collectionId);
  }
}
