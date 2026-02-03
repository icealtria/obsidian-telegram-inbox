import { type Vault } from "obsidian";
import { Mutex } from "async-mutex";
import type { TGInboxSettings } from "../settings/types";
import { insertMessage, insertMessageAtTop } from "../io";
import { getSavePath } from "../utils/file";
import type { MessageUpdate } from "../type";

export class VaultWriter {
  private mutex = new Mutex();

  constructor(private vault: Vault, private settings: TGInboxSettings) {}

  getVault(): Vault {
    return this.vault;
  }

  async insertMessageToVault(content: string, msg: MessageUpdate): Promise<void> {
    const release = await this.mutex.acquire();
    try {
      const savedPath = await getSavePath(this.vault, this.settings, msg)

      if (this.settings.reverse_order) {
        await insertMessageAtTop(this.vault, content, savedPath);
      } else {
        await insertMessage(this.vault, content, savedPath);
      }
    } catch (error) {
      console.error(`Error inserting message to vault: ${error}`);
      throw error;
    } finally {
      release();
    }
  }
}
