import { Injectable } from "@angular/core";
import { StateService } from "./state.service";
import { Attachment } from "../model/attachment.model";

@Injectable({
    providedIn: 'root',
})
export class AttachmentsService {
    constructor(
        private state: StateService,
    ) { }

    /**
     * Upload a new file to the filesystem, then insert it into
     * the electron database, and finally, update the state 
     * accordingly. 
     * 
     * @param file 
     * @param name 
     * @returns 
     */
    async createAttachment(file: File, name: string) {
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
                name: name,
                date: new Date().toISOString().split('T')[0],
                description: '',
                notes: '',
                fileName: fileName
            });

            this.state.attachments.set([
                ...this.state.attachments(),
                newAttachment,
            ])
            this.selectAttachment(newAttachment);
        } catch (error) {
            console.error('Failed to create attachment:', error);
        }
    }

    /**
     * Load initial list of attachments from the electronAPI
     */
    async loadAttachments() {
        try {
            const loadedAttachments = await (window as any).electronAPI.listAttachments();
            this.state.attachments.set(loadedAttachments || []);
        } catch (error) {
            console.error('Failed to load attachments:', error);
            this.state.attachments.set([]);
        } finally {
            this.state.isInitialized.set(true);
        }
    }

    /**
     * Update an attachment's data in electron and local state
     */
    async updateAttachment(attachment: Attachment) {
        try {
            await (window as any).electronAPI.updateAttachment(attachment);

            this.state.attachments.set(
                this.state.attachments().map(a => a.id === attachment.id ?
                    attachment
                    :
                    a
                )
            )
        } catch (error) {
            console.error('Failed to update attachment:', error);
        }
    }

    async deleteAttachment(attachment: Attachment) {
        try {
            // Edge case, this is the last attachment
            if (this.state.filteredAttachments().length == 1) {
                this.selectAttachment(null)
            } else {
                this.selectNextAttachment()
            }

            // Delete file from filesystem if it exists
            if (attachment.fileName) {
                const result = await (window as any).electronAPI.deleteFile(attachment.fileName);
                if (!result.success) {
                    console.error('Failed to delete file:', result.error);
                }
            }

            // Delete from database
            await (window as any).electronAPI.deleteAttachment(attachment.id);

            // Remove from state
            this.state.attachments.update(attachments =>
                attachments.filter(a => a.id !== attachment.id)
            );

        } catch (error) {
            console.error('Failed to delete attachment:', error);
        }
    }

    /**
     * Set the given attachment as selected
     *
     * @param attachment
     */
    selectAttachment(attachment: Attachment | null) {
        this.state.selectedAttachment.set(attachment);
    }

    selectNextAttachment() {
        const currentAttachments = this.state.filteredAttachments();
        if (currentAttachments.length === 0) return;

        const currentSelected = this.state.selectedAttachment();
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
        const currentAttachments = this.state.filteredAttachments();
        if (currentAttachments.length === 0) return;

        const currentSelected = this.state.selectedAttachment();
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

    /**
     * Invoke the operating system's "open x" on the given file
     * @param attachment
     * @returns 
     */
    async openAttachment(attachment: Attachment) {
        if (!attachment.fileName) {
            console.log('No file associated with this attachment');
            return;
        }

        const result = await (window as any).electronAPI.openFile(attachment.fileName);
        if (!result.success) {
            console.error('Failed to open file:', result.error);
        }
    }

    /**
     * Open the operating system's "save" dialog on the given file,
     * used to get it into a separate folder
     * 
     * @param attachment
     */
    async downloadAttachment(attachment: Attachment) {
        if (!attachment.fileName) {
            console.log('No file associated with this attachment');
            return;
        }

        const result = await (window as any).electronAPI.downloadFile(attachment.fileName, attachment.name);
        if (!result.success) {
            console.error('Failed to download file:', result.error);
        }
    }
}