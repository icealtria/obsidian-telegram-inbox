import { App, Notice, Plugin, PluginSettingTab, Setting } from "obsidian";
import { TelegramBot } from "./bot";
import { MyPluginSettings } from "./type";

const DEFAULT_SETTINGS: MyPluginSettings = {
  token: "",
  marker: "#inbox",
  allow_users: [],
  bullet: true,
  download_dir: "/assets",
  download_media: false,
};
export default class TGInbox extends Plugin {
  settings: MyPluginSettings;
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
      await this.stopBot();
      this.bot = new TelegramBot(this.app, this.settings);
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
      }
    } catch (error) {
      console.error("Error stopping bot:", error);
    }
  }
}

class TGInboxSettingTab extends PluginSettingTab {
  plugin: TGInbox;
  statusEl: HTMLDivElement;
  updateId: NodeJS.Timer;

  constructor(app: App, plugin: TGInbox) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    this.statusEl = containerEl.createDiv({
      cls: "tg-inbox-status",
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
          this.statusEl.setText("Restarting...");
        });
      });

    new Setting(containerEl)
      .setName("Allowed users")
      .setDesc(
        "List of user messages would be received.\nSeparate with a comma."
      )
      .addText((text) =>
        text
          .setPlaceholder("Enter Telegram usernames or id")
          .setValue(this.plugin.settings.allow_users.join(","))
          .onChange(async (value) => {
            this.plugin.settings.allow_users = value.split(",");
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Download Directory")
      .setDesc("Specify the directory for downloading media files")
      .addText((text) =>
        text
          .setPlaceholder("Enter download directory")
          .setValue(this.plugin.settings.download_dir)
          .onChange(async (value) => {
            this.plugin.settings.download_dir = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Bullet Points")
      .setDesc("Enable bullet points for inserted messages")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.bullet).onChange(async (value) => {
          this.plugin.settings.bullet = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("Download Media")
      .setDesc("Choose whether to download media along with messages")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.download_media)
          .onChange(async (value) => {
            this.plugin.settings.download_media = value;
            await this.plugin.saveSettings();
          })
      );
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
