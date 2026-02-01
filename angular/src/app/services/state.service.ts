import { computed, Injectable, signal } from "@angular/core";
import { Attachment } from "../model/attachment.model";
import { P } from "@angular/cdk/keycodes";

/**
 * Centralized application state management service, currently using just
 * signals as storage containers
 */
@Injectable({
    providedIn: 'root',
})
export class StateService {
    // Core signals, whos value directly represents some data
    readonly attachments = signal<Attachment[]>([]);
    readonly selectedAttachment = signal<Attachment | null>(null);
    readonly attachmentSearchText = signal('');

    // Initially set to false, but becomes true after initial app
    // data has been loaded in
    readonly isInitialized = signal<boolean>(false);

    // Derived signals, made using 'computed'
    readonly filteredAttachments = computed(() => {
        const searchText = this.attachmentSearchText();
        const attachments = this.attachments();

        const normalizeText = (t: string) => t.toLowerCase().replace(/[^\w\s]/g, '');

        if (!searchText) {
            return attachments;
        }

        return attachments.filter(a => {
            const name = normalizeText(a.name);
            const description = normalizeText(a.description);
            const notes = normalizeText(a.notes);

            return name.includes(searchText) ||
                description.includes(searchText) ||
                notes.includes(searchText);
        });
    })

}