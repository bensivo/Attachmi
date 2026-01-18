import { Component, input, output, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzInputModule } from 'ng-zorro-antd/input';

@Component({
  selector: 'app-add-attachment-modal',
  standalone: true,
  imports: [
    FormsModule,
    NzModalModule,
    NzInputModule
  ],
  templateUrl: './add-attachment-modal.component.html',
  styleUrl: './add-attachment-modal.component.less'
})
export class AddAttachmentModalComponent {
  visible = model.required<boolean>();
  
  newAttachmentName = model.required<string>();
  newAttachmentFileName = model.required<string>();

  cancel = output<void>();
  submit = output<File | null>();

  private file: File | null = null;

  onFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.file = input.files[0];
      this.newAttachmentFileName.set(this.file.name);
      if (!this.newAttachmentName()) {
        this.newAttachmentName.set(this.file.name);
      }
    }
  }

  onCancel() {
    this.cancel.emit();
  }

  onSubmit() {
    this.submit.emit(this.file);
  }
}
