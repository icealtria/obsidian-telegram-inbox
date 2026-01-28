import { Notice, Plugin } from "obsidian";
import { TelegramBot } from "./bot";
import { type TGInboxSettings, DEFAULT_SETTINGS } from "./settings/types";
import { TGInboxSettingTab } from "./settings";
import { runAfterSync } from "./utils/sync";

export default class TGInbox extends Plugin {
  settings: TGInboxSettings;
  bot: TelegramBot | null;
  botInfo: {
    username: string;
    isConnected: boolean;
  };

  async onload() {
    this.addSettingTab(new TGInboxSettingTab(this.app, this));
    this.addCommands();
    await this.loadSettings();

    if (this.settings.disable_auto_reception) {
      this.addRibbonIcon("send", "Telegram Inbox: Get Updates", () => {
        this.bot?.getUpdates();
      });
    }

    if (this.settings.run_after_sync) {
      runAfterSync.call(this, () => {
        this.initBot();
      });
    } else {
      this.initBot();
    }
  }

  addCommands() {
    this.addCommand({
      id: "tg-inbox-getupdates",
      name: "Get Updates",
      callback: () => this.bot?.getUpdates(),
    });

    this.addCommand({
      id: "tg-inbox-start",
      name: "Start Telegram Bot",
      callback: () => this.startBot(),
    });

    this.addCommand({
      id: "tg-inbox-stop",
      name: "Stop Telegram Bot",
      callback: () => this.stopBot(),
    });
  }

  async getBotInfo() {
    if (this.bot) {
      return this.bot.bot.api.getMe();
    }
    return null;
  }

  async onunload() {
    this.stopBot();
    console.log("telegram inbox unloaded");
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  async initBot() {
    try {
      if (!this.settings.token) {
        new Notice("Telegram bot token not set");
        return;
      }
      await this.stopBot();
      this.bot = new TelegramBot(this.app.vault, this.settings);
      if (!this.settings.disable_auto_reception) {
        this.startBot();
      }
    } catch (error) {
      console.error("Error launching bot:", error);
      new Notice("Error launching bot");
      this.bot = null;
    }
  }

  async startBot() {
    new Notice("Telegram bot starting");
    if (this.bot) {
      this.bot.start();
    }
  }

  async stopBot() {
    try {
      if (this.bot) {
        await this.bot.bot.stop();
        console.log("bot stopped");
        new Notice("Telegram bot stopped");
      }
    } catch (error) {
      console.error("Error stopping bot:", error);
    }
  }
}
