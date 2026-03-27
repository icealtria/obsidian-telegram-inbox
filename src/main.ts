import { Notice, Plugin } from "obsidian";
import { TelegramBot } from "./bot";
import { type TGInboxSettings, DEFAULT_SETTINGS } from "./settings/types";
import { TGInboxSettingTab } from "./settings";
import { runAfterSync } from "./utils/sync";
import {
  DEFAULT_RUNTIME_STATE,
  type TGInboxRuntimeState,
  RuntimeStateStore,
} from "./state";

interface PluginPersistedData {
  settings: TGInboxSettings;
  runtime_state: TGInboxRuntimeState;
}

export default class TGInbox extends Plugin {
  settings: TGInboxSettings;
  bot: TelegramBot | null;
  runtimeState: TGInboxRuntimeState;
  runtimeStateStore: RuntimeStateStore;
  botInfo: {
    username: string;
    isConnected: boolean;
  };

  async onload() {
    await this.loadSettings();
    this.runtimeStateStore = new RuntimeStateStore(
      this.runtimeState,
      async () => this.savePluginData()
    );
    this.addSettingTab(new TGInboxSettingTab(this.app, this));
    this.addCommands();

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

    this.addCommand({
      id: "tg-inbox-retry-failed-queue",
      name: "Retry Failed Queue Items",
      callback: async () => {
        if (!this.bot) {
          new Notice("Telegram bot is not running");
          return;
        }
        const retriedCount = await this.bot.retryFailedQueue();
        new Notice(`Retry queue processed: ${retriedCount} item(s) attempted`);
      },
    });

    this.addCommand({
      id: "tg-inbox-clear-failed-queue",
      name: "Clear Failed Queue Items",
      callback: async () => {
        await this.runtimeStateStore.clearRetryQueue();
        new Notice("Failed queue cleared");
      },
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
    const rawData = await this.loadData();
    const parsedData = this.parsePersistedData(rawData);
    this.settings = parsedData.settings;
    this.runtimeState = parsedData.runtime_state;
  }

  async saveSettings() {
    await this.savePluginData();
  }

  async savePluginData() {
    await this.saveData({
      settings: this.settings,
      runtime_state: this.runtimeState,
    } satisfies PluginPersistedData);
  }

  async initBot() {
    try {
      if (!this.settings.token) {
        new Notice("Telegram bot token not set");
        return;
      }
      await this.stopBot();
      this.bot = new TelegramBot(this.app.vault, this.settings, this.runtimeStateStore);
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
      const retryQueueSize = this.bot.getRetryQueueSize();
      if (retryQueueSize > 0) {
        await this.bot.retryFailedQueue();
      }
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

  private parsePersistedData(rawData: unknown): PluginPersistedData {
    // Backward compatibility: older versions stored only settings at root level.
    const isModernData =
      typeof rawData === "object" &&
      rawData !== null &&
      "settings" in rawData &&
      "runtime_state" in rawData;

    if (isModernData) {
      const modernData = rawData as Partial<PluginPersistedData>;
      const runtimeState = Object.assign(
        {},
        DEFAULT_RUNTIME_STATE,
        modernData.runtime_state ?? {}
      );
      return {
        settings: Object.assign({}, DEFAULT_SETTINGS, modernData.settings ?? {}),
        runtime_state: {
          last_processed_update_id:
            typeof runtimeState.last_processed_update_id === "number"
              ? runtimeState.last_processed_update_id
              : 0,
          processed_message_keys: Array.isArray(runtimeState.processed_message_keys)
            ? runtimeState.processed_message_keys
            : [],
          retry_queue: Array.isArray(runtimeState.retry_queue)
            ? runtimeState.retry_queue
            : [],
        },
      };
    }

    return {
      settings: Object.assign({}, DEFAULT_SETTINGS, rawData ?? {}),
      runtime_state: Object.assign({}, DEFAULT_RUNTIME_STATE),
    };
  }
}
