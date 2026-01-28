import { Bot } from "grammy";
import { type Vault } from "obsidian";
import type { TGInboxSettings } from "./settings/types";
import { createRestrictToAllowedUsersMiddleware, createRecordUpdateIdMiddleware } from "./bot/middleware";
import { VaultWriter } from "./bot/vault-writer";
import { setupCommands, setupMessageHandlers } from "./bot/handlers";

export class TelegramBot {
  bot: Bot;
  vault: Vault;
  settings: TGInboxSettings;
  update_id: number;
  private vaultWriter: VaultWriter;

  constructor(vault: Vault, settings: TGInboxSettings) {
    this.vault = vault;
    this.settings = settings;
    this.vaultWriter = new VaultWriter(vault, settings);
    this.bot = new Bot(settings.token);

    if (settings.disable_auto_reception) {
      this.bot.init();
    }

    this.setupMiddlewares();
    this.setupHandlers();

    this.bot.catch((err) => {
      console.error("An error occurred in the Telegram bot:", err);
    });
  }

  private setupMiddlewares() {
    this.bot.use(createRestrictToAllowedUsersMiddleware(this.settings));
    this.bot.use(createRecordUpdateIdMiddleware((id) => {
      this.update_id = id;
    }));
  }

  private setupHandlers() {
    setupCommands(this.bot, this.vaultWriter);
    setupMessageHandlers(this.bot, this.settings, this.vaultWriter);
  }

  start() {
    this.bot.start();
  }

  async getUpdates() {
    const offset = this.update_id ? this.update_id + 1 : 1;
    const updates = await this.bot.api.getUpdates({ offset });
    
    for (const update of updates) {
        await this.bot.handleUpdate(update);
    }
    
    if (updates.length > 0) {
      this.bot.api.getUpdates({ offset: this.update_id + 1, limit: 1 });
    }
  }
}