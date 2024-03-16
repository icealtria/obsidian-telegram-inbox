import { App, Notice, Plugin, PluginSettingTab, Setting } from "obsidian";
import { TelegramBot } from "./bot";

interface MyPluginSettings {
  token: string;
  marker: string;
  http_proxy: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
  token: "",
  marker: "#memo",
  http_proxy: "",
};
export default class TGMemo extends Plugin {
  settings: MyPluginSettings;
  bot: TelegramBot | null;
  botInfo: {
    username: string;
    isConnected: boolean;
  };

  async onload() {
    this.addSettingTab(new TGMemoSettingTab(this.app, this));
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
    console.log("telegram memo unloaded");
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  async launchBot() {
    try {
      await this.stopBot();
      this.bot = new TelegramBot(this.app, this.settings.token);
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
      }
    } catch (error) {
      console.error("Error stopping bot:", error);
    }
  }
}

class TGMemoSettingTab extends PluginSettingTab {
  plugin: TGMemo;
  statusEl: HTMLDivElement;
  updateId: NodeJS.Timer;

  constructor(app: App, plugin: TGMemo) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    this.statusEl = containerEl.createDiv({
      cls: "tg-memo-status",
      text: "Bot disconnected",
    });

    this.updateStatus();

    this.updateId = setInterval(async () => {
      await this.updateStatus();
    }, 5000);

    new Setting(containerEl)
      .setName("Bot Token")
      .setDesc("Get your bot token from @BotFather")
      .addText((text) =>
        text
          .setPlaceholder("Enter your bot token")
          .setValue(this.plugin.settings.token)
          .onChange(async (value) => {
            this.plugin.settings.token = value;
            await this.plugin.saveSettings();
          })
      )
      .addButton((button) => {
        button.setButtonText("Restart").onClick(async () => {
          this.plugin.launchBot();
        });
      });
  }

  hide() {
    clearInterval(this.updateId);
  }
  async updateStatus() {
    try {
      const me = await this.plugin.getBotInfo();
      if (me) {
        this.statusEl.setText(`Bot connected as @${me.username}`);
      } else {
        this.statusEl.setText("Bot not connected");
      }
    } catch {
      this.statusEl.setText("Bot not connected");
    }
  }
}
