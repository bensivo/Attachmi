import { Component, signal, effect, viewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import {
  HeaderComponent,
  AttachmentsListComponent,
  AttachmentDetailsComponent,
  AddAttachmentModalComponent,
  Attachment
} from './components';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    FormsModule,
    NzLayoutModule,
    NzSplitterModule,
    NzModalModule,
    NzInputModule,
    HeaderComponent,
    AttachmentsListComponent,
    AttachmentDetailsComponent,
    AddAttachmentModalComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.less'
})

export class App {
  protected readonly title = signal('attachmi');

  // Tab navigation
  protected readonly activeTab = signal<'files' | 'collections'>('files');

  // Collections data
  protected readonly collections = signal<{ id: number; name: string; count: number }[]>([]);
  protected readonly selectedCollection = signal<{ id: number; name: string; count: number } | null>(null);

  // Global state signals for specific application components
  protected readonly attachmentSearchText = signal('');
  protected readonly isAddAttachmentModelVisible = signal(false);
  protected readonly isAddCollectionModalVisible = signal(false);
  protected readonly isEditingAttachmentDetails = signal(false);
  protected readonly newAttachmentName = signal('');
  protected readonly newAttachmentFileName = signal('');
  protected readonly newCollectionName = signal('');
  protected readonly isDragging = signal(false);
  protected readonly droppedFile = signal<File | null>(null);

  // Global application data signals
  protected readonly attachments = signal<Attachment[]>([]);
  protected readonly collectionAttachments = signal<Attachment[]>([]);
  protected readonly selectedAttachment = signal<Attachment | null>(null);
  protected readonly attachmentCollections = signal<{ id: number; name: string }[]>([]);

  // False when app loads, True once initial data has been loaded in from backend
  private isInitialized = false;

  // Reference to header component for keyboard shortcuts
  private headerComponent = viewChild(HeaderComponent);

  // Reference to attachment details component for focusing inputs
  private attachmentDetailsComponent = viewChild(AttachmentDetailsComponent);

  constructor() {
    // Load attachments and collections on init
    this.loadAttachments();
    this.loadCollections();

    // Auto-save selected attachment changes
    effect(() => {
      const attachment = this.selectedAttachment();
      if (attachment && this.isInitialized && !this.isEditingAttachmentDetails()) {
        // Save after a small delay to batch rapid changes
        setTimeout(() => this.updateAttachment(attachment), 500);
      }
    });
  }

  private async loadAttachments() {
    try {
      const loadedAttachments = await (window as any).electronAPI.listAttachments();
      this.attachments.set(loadedAttachments || []);
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to load attachments:', error);
      this.attachments.set([]);
      this.isInitialized = true;
    }
  }

  private async loadCollections() {
    try {
      const loadedCollections = await (window as any).electronAPI.listCollections();
      this.collections.set(loadedCollections || []);
    } catch (error) {
      console.error('Failed to load collections:', error);
      this.collections.set([]);
    }
  }

  private async updateAttachment(attachment: Attachment) {
    try {
      await (window as any).electronAPI.updateAttachment(attachment);
    } catch (error) {
      console.error('Failed to update attachment:', error);
    }
  }

  /**
   * Returns the list of attachments, properly filtered
   * based on the current search text.
   */
  get filteredAttachments(): Attachment[] {
    const search = this.normalizeText(this.attachmentSearchText());
    const currentAttachments = this.attachments();

    if (!search) {
      return currentAttachments;
    }

    return currentAttachments.filter(attachment => {
      const name = this.normalizeText(attachment.name);
      const description = this.normalizeText(attachment.description);
      const notes = this.normalizeText(attachment.notes);

      return name.includes(search) ||
             description.includes(search) ||
             notes.includes(search);
    });
  }

  /**
   * Returns the list of collection attachments, properly filtered
   * based on the current search text.
   */
  get filteredCollectionAttachments(): Attachment[] {
    const search = this.normalizeText(this.attachmentSearchText());
    const currentAttachments = this.collectionAttachments();

    if (!search) {
      return currentAttachments;
    }

    return currentAttachments.filter(attachment => {
      const name = this.normalizeText(attachment.name);
      const description = this.normalizeText(attachment.description);
      const notes = this.normalizeText(attachment.notes);

      return name.includes(search) ||
             description.includes(search) ||
             notes.includes(search);
    });
  }

  /**
   * Returns collections that the current attachment is NOT in
   */
  get availableCollections(): { id: number; name: string; count: number }[] {
    const attachmentCollectionIds = this.attachmentCollections().map(c => c.id);
    return this.collections().filter(c => !attachmentCollectionIds.includes(c.id));
  }

  private normalizeText(text: string): string {
    return text.toLowerCase().replace(/[^\w\s]/g, '');
  }

  async selectAttachment(attachment: Attachment) {
    this.selectedAttachment.set(attachment);
    this.isEditingAttachmentDetails.set(false);

    // Load collections for this attachment
    try {
      const collections = await (window as any).electronAPI.getAttachmentCollections(attachment.id);
      this.attachmentCollections.set(collections || []);
    } catch (error) {
      console.error('Failed to load attachment collections:', error);
      this.attachmentCollections.set([]);
    }
  }

  toggleEdit() {
    const wasEditing = this.isEditingAttachmentDetails();
    this.isEditingAttachmentDetails.set(!wasEditing);

    // Focus the title input when entering edit mode
    if (!wasEditing) {
      this.attachmentDetailsComponent()?.focusTitleInput();
    }
  }

  showModal() {
    this.isAddAttachmentModelVisible.set(true);
  }

  handleCancel() {
    this.isAddAttachmentModelVisible.set(false);
    this.newAttachmentName.set('');
    this.newAttachmentFileName.set('');
    this.droppedFile.set(null);
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();

    // Only set isDragging to false if we're leaving the nz-layout element
    // This prevents flickering when dragging over child elements
    if (event.target === event.currentTarget) {
      this.isDragging.set(false);
    }
  }

  async onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];

      // Automatically create attachment with the original filename
      await this.createAttachmentFromFile(file, file.name);
    }
  }

  private async createAttachmentFromFile(file: File, attachmentName: string) {
    const fileName = `${Date.now()}_${file.name}`;

    // Convert file to base64
    const reader = new FileReader();
    const fileData = await new Promise<string>((resolve) => {
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.readAsDataURL(file);
    });

    // Save file via Electron IPC
    const result = await (window as any).electronAPI.saveFile(fileName, fileData);
    if (!result.success) {
      console.error('Failed to save file:', result.error);
      return;
    }

    try {
      const newAttachment = await (window as any).electronAPI.createAttachment({
        name: attachmentName,
        date: new Date().toISOString().split('T')[0],
        description: '',
        notes: '',
        fileName: fileName
      });

      this.attachments.update(attachments => [...attachments, newAttachment]);
      this.selectAttachment(newAttachment);
    } catch (error) {
      console.error('Failed to create attachment:', error);
    }
  }

  async handleSubmit(file: File | null) {
    if (!this.newAttachmentName()) {
      return;
    }

    let fileName: string | undefined;

    // If a file was selected, save it to the filesystem
    if (file) {
      fileName = `${Date.now()}_${file.name}`;

      // Convert file to base64
      const reader = new FileReader();
      const fileData = await new Promise<string>((resolve) => {
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.readAsDataURL(file);
      });


      // Save file via Electron IPC
      const result = await (window as any).electronAPI.saveFile(fileName, fileData);
      if (!result.success) {
        console.error('Failed to save file:', result.error);
        return;
      }
    }

    try {
      const newAttachment = await (window as any).electronAPI.createAttachment({
        name: this.newAttachmentName(),
        date: new Date().toISOString().split('T')[0],
        description: '',
        notes: '',
        fileName: fileName
      });

      this.attachments.update(attachments => [...attachments, newAttachment]);
      this.selectAttachment(newAttachment);
      this.handleCancel();
    } catch (error) {
      console.error('Failed to create attachment:', error);
    }
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

  async downloadFile(attachment: Attachment) {
    if (!attachment.fileName) {
      console.log('No file associated with this attachment');
      return;
    }

    const result = await (window as any).electronAPI.downloadFile(attachment.fileName, attachment.name);
    if (!result.success) {
      console.error('Failed to download file:', result.error);
    }
  }

  async deleteAttachment(attachment: Attachment) {
    try {
      // Delete file from filesystem if it exists
      if (attachment.fileName) {
        const result = await (window as any).electronAPI.deleteFile(attachment.fileName);
        if (!result.success) {
          console.error('Failed to delete file:', result.error);
          // Continue with database deletion even if file deletion fails
        }
      }

      // Delete from database
      await (window as any).electronAPI.deleteAttachment(attachment.id);

      // Remove from array
      this.attachments.update(attachments =>
        attachments.filter(a => a.id !== attachment.id)
      );

      // Clear selection if this was the selected attachment
      if (this.selectedAttachment()?.id === attachment.id) {
        this.selectedAttachment.set(null);
      }
    } catch (error) {
      console.error('Failed to delete attachment:', error);
    }
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    // CMD+F (Mac) or Ctrl+F (Windows/Linux) - Focus search
    if ((event.metaKey || event.ctrlKey) && event.key === 'f') {
      event.preventDefault();
      this.headerComponent()?.focusSearchInput();
    }

    // CMD+N (Mac) or Ctrl+N (Windows/Linux) - Open add attachment modal
    if ((event.metaKey || event.ctrlKey) && event.key === 'n') {
      event.preventDefault();
      this.showModal();
    }

    // CMD+J (Mac) or Ctrl+J (Windows/Linux) - Select next attachment
    if ((event.metaKey || event.ctrlKey) && event.key === 'j') {
      event.preventDefault();
      this.selectNextAttachment();
    }

    // CMD+K (Mac) or Ctrl+K (Windows/Linux) - Select previous attachment
    if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
      event.preventDefault();
      this.selectPreviousAttachment();
    }

    // CMD+O (Mac) or Ctrl+O (Windows/Linux) - Open file if detail page is active
    if ((event.metaKey || event.ctrlKey) && event.key === 'o') {
      event.preventDefault();
      const attachment = this.selectedAttachment();
      if (attachment && attachment.fileName) {
        this.openFile(attachment);
      }
    }

    // CMD+E (Mac) or Ctrl+E (Windows/Linux) - Toggle edit mode
    if ((event.metaKey || event.ctrlKey) && event.key === 'e') {
      event.preventDefault();
      if (this.selectedAttachment()) {
        this.toggleEdit();
      }
    }

    // CMD+S (Mac) or Ctrl+S (Windows/Linux) - Save (exit edit mode)
    if ((event.metaKey || event.ctrlKey) && event.key === 's') {
      event.preventDefault();
      if (this.selectedAttachment() && this.isEditingAttachmentDetails()) {
        this.toggleEdit();
      }
    }

    // CMD+P (Mac) or Ctrl+P (Windows/Linux) - Download file
    if ((event.metaKey || event.ctrlKey) && event.key === 'p') {
      event.preventDefault();
      const attachment = this.selectedAttachment();
      if (attachment && attachment.fileName) {
        this.downloadFile(attachment);
      }
    }
  }

  selectNextAttachment() {
    const currentAttachments = this.filteredAttachments;
    if (currentAttachments.length === 0) return;

    const currentSelected = this.selectedAttachment();
    if (!currentSelected) {
      // No selection, select first item
      this.selectAttachment(currentAttachments[0]);
      return;
    }

    const currentIndex = currentAttachments.findIndex(a => a.id === currentSelected.id);
    if (currentIndex === -1 || currentIndex === currentAttachments.length - 1) {
      // Either the current item was not found (possible if we added a filter after selecting it)
      // Or we're already at the end of the list. 

      // Go back to the beginning
      this.selectAttachment(currentAttachments[0]);
      return;
    }

    

    // Select next item
    this.selectAttachment(currentAttachments[currentIndex + 1]);
  }

  selectPreviousAttachment() {
    const currentAttachments = this.filteredAttachments;
    if (currentAttachments.length === 0) return;

    const currentSelected = this.selectedAttachment();
    if (!currentSelected) {
      // No selection, select last item
      this.selectAttachment(currentAttachments[currentAttachments.length - 1]);
      return;
    }

    const currentIndex = currentAttachments.findIndex(a => a.id === currentSelected.id);
    if (currentIndex === -1 || currentIndex === 0) {
      // Either the current item was not found (possible if we added a filter after selecting it)
      // Or we're already at the beginning of the list.

      // Go back to the end
      this.selectAttachment(currentAttachments[currentAttachments.length - 1]);
    }

    // Select previous item
    this.selectAttachment(currentAttachments[currentIndex - 1]);
  }

  switchTab(tab: 'files' | 'collections') {
    this.activeTab.set(tab);
  }

  createNewCollection() {
    this.isAddCollectionModalVisible.set(true);
  }

  handleCollectionCancel() {
    this.isAddCollectionModalVisible.set(false);
    this.newCollectionName.set('');
  }

  async handleCollectionSubmit() {
    if (!this.newCollectionName()) {
      return;
    }

    try {
      const newCollection = await (window as any).electronAPI.createCollection({
        name: this.newCollectionName()
      });

      this.collections.update(collections => [...collections, newCollection]);
      this.handleCollectionCancel();
    } catch (error) {
      console.error('Failed to create collection:', error);
    }
  }

  async selectCollection(collectionId: number) {
    const collection = this.collections().find(c => c.id === collectionId);
    if (collection) {
      this.selectedCollection.set(collection);

      // Load attachments for this collection
      try {
        const attachments = await (window as any).electronAPI.getCollectionAttachments(collectionId);
        this.collectionAttachments.set(attachments || []);
      } catch (error) {
        console.error('Failed to load collection attachments:', error);
        this.collectionAttachments.set([]);
      }
    }
  }

  backToCollections() {
    this.selectedCollection.set(null);
    this.collectionAttachments.set([]);
    this.selectedAttachment.set(null);
  }

  addFilesToCollection() {
    // TODO: Implement add files to collection
    console.log('Add files to collection clicked');
  }

  async deleteCollection() {
    const collection = this.selectedCollection();
    if (!collection) return;

    try {
      await (window as any).electronAPI.deleteCollection(collection.id);

      // Remove from collections list
      this.collections.update(collections =>
        collections.filter(c => c.id !== collection.id)
      );

      // Go back to collections grid
      this.backToCollections();
    } catch (error) {
      console.error('Failed to delete collection:', error);
    }
  }

  async addToCollection(collectionId: number) {
    const attachment = this.selectedAttachment();
    if (!attachment) return;

    try {
      await (window as any).electronAPI.addAttachmentToCollection(collectionId, attachment.id);

      // Reload attachment collections
      const collections = await (window as any).electronAPI.getAttachmentCollections(attachment.id);
      this.attachmentCollections.set(collections || []);

      // Reload all collections to update counts
      await this.loadCollections();
    } catch (error) {
      console.error('Failed to add attachment to collection:', error);
    }
  }

  async removeFromCollection(collectionId: number) {
    const attachment = this.selectedAttachment();
    if (!attachment) return;

    try {
      await (window as any).electronAPI.removeAttachmentFromCollection(collectionId, attachment.id);

      // Reload attachment collections
      const collections = await (window as any).electronAPI.getAttachmentCollections(attachment.id);
      this.attachmentCollections.set(collections || []);

      // Reload all collections to update counts
      await this.loadCollections();
    } catch (error) {
      console.error('Failed to remove attachment from collection:', error);
    }
  }
}
