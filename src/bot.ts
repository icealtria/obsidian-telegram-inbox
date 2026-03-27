import { Bot } from "grammy";
import { type Vault } from "obsidian";
import type { TGInboxSettings } from "./settings/types";
import {
  createRestrictToAllowedUsersMiddleware,
  createRecordUpdateIdMiddleware,
} from "./bot/middleware";
import { VaultWriter } from "./bot/vault-writer";
import { setupCommands, setupMessageHandlers } from "./bot/handlers";
import { RuntimeStateStore } from "./state";

const DEFAULT_OFFSET = 1;

export class TelegramBot {
  bot: Bot;
  vault: Vault;
  settings: TGInboxSettings;
  update_id = 0;
  private vaultWriter: VaultWriter;
  private runtimeStateStore: RuntimeStateStore;

  constructor(vault: Vault, settings: TGInboxSettings, runtimeStateStore: RuntimeStateStore) {
    this.vault = vault;
    this.settings = settings;
    this.runtimeStateStore = runtimeStateStore;
    this.vaultWriter = new VaultWriter(vault, settings);
    this.bot = new Bot(settings.token);

    if (settings.disable_auto_reception) {
      this.bot.init();
    }

    this.setupMiddlewares();
    this.setupHandlers();
    this.setupErrorHandling();
  }

  private setupMiddlewares(): void {
    this.bot.use(createRestrictToAllowedUsersMiddleware(this.settings));
    this.bot.use(
      createRecordUpdateIdMiddleware((id) => {
        this.update_id = id;
      })
    );
  }

  private setupHandlers(): void {
    setupCommands(this.bot, this.settings, this.vaultWriter, this.runtimeStateStore);
    setupMessageHandlers(this.bot, this.settings, this.vaultWriter, this.runtimeStateStore);
  }

  private setupErrorHandling(): void {
    this.bot.catch((err) => {
      console.error("An error occurred in the Telegram bot:", err);
    });
  }

  start(): void {
    this.bot.start();
  }

  async getUpdates(): Promise<void> {
    try {
      const persistedUpdateId = this.runtimeStateStore.getLastProcessedUpdateId();
      const latestKnownUpdateId = Math.max(this.update_id, persistedUpdateId);
      const offset = latestKnownUpdateId ? latestKnownUpdateId + 1 : DEFAULT_OFFSET;
      const updates = await this.bot.api.getUpdates({ offset });

      for (const update of updates) {
        await this.bot.handleUpdate(update);
      }

      if (updates.length > 0 && this.update_id) {
        // Acknowledge the last update
        await this.bot.api.getUpdates({
          offset: this.update_id + 1,
          limit: 1,
        });
      }
    } catch (error) {
      console.error("Error getting updates:", error);
      throw error;
    }
  }

  /**
   * Processes retry queue entries that are due.
   * Returns number of items attempted in this pass.
   */
  async retryFailedQueue(): Promise<number> {
    const pending = this.runtimeStateStore.getReadyRetries();

    for (const item of pending) {
      try {
        await this.vaultWriter.insertMessageToVault(item.content, item.msg);
        await this.runtimeStateStore.markProcessed(item.message_key, item.update_id);
      } catch (error) {
        await this.runtimeStateStore.markRetryAttemptFailure(
          item.id,
          (error as Error).message
        );
      }
    }

    return pending.length;
  }

  /** Returns current retry queue size for status/reporting. */
  getRetryQueueSize(): number {
    return this.runtimeStateStore.getRetryQueueSize();
  }
}
