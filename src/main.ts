import { Notice, Plugin } from "obsidian";
import { TelegramBot } from "./bot";
import type { TGInboxSettings } from "./settings";
import { TGInboxSettingTab } from "./settings";

const DEFAULT_SETTINGS: TGInboxSettings = {
  token: "",
  marker: "#inbox",
  allow_users: [],
  bullet: true,
  download_dir: "/assets",
  download_media: false,
  markdown_escaper: false,
  message_template: "{{{text}}}",
  is_custom_file: false,
  custom_file_path: "Telegram-Inbox.md",
};

export default class TGInbox extends Plugin {
  settings: TGInboxSettings;
  bot: TelegramBot | null;
  botInfo: {
    username: string;
    isConnected: boolean;
  };

  async onload() {
    this.addSettingTab(new TGInboxSettingTab(this.app, this));
    await this.loadSettings();
    this.launchBot();
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

  async launchBot() {
    try {
      if (!this.settings.token) {
        new Notice("Telegram bot token not set");
        return;
      }
      await this.stopBot();
      this.bot = new TelegramBot(this.app.vault, this.settings);
      new Notice("Telegram bot starting");
      this.bot.start();
    } catch (error) {
      console.error("Error launching bot:", error);
      new Notice("Error launching bot");
      this.bot = null;
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
