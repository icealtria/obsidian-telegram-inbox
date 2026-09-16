import { type Vault } from "obsidian";
import type { TGInboxSettings } from "../settings/types";
import { insertMessage, insertMessageAtTop, insertMessageAfterHeading } from "../io";
import { getSavePath } from "../utils/file";
import type { MessageUpdate } from "../type";

export class VaultWriter {
    constructor(
        private vault: Vault,
        private settings: TGInboxSettings,
    ) {}

    getVault(): Vault {
        return this.vault;
    }

    async insertMessageToVault(content: string, msg: MessageUpdate): Promise<void> {
        const savedPath = await getSavePath(this.vault, this.settings, msg);

        if (this.settings.insert_after_heading && this.settings.target_heading) {
            await insertMessageAfterHeading(
                this.vault,
                content,
                savedPath,
                this.settings.target_heading,
                this.settings.reverse_order,
            );
        } else if (this.settings.reverse_order) {
            await insertMessageAtTop(this.vault, content, savedPath);
        } else {
            await insertMessage(this.vault, content, savedPath);
        }
    }
}
