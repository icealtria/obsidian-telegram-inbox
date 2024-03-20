import { App, PluginSettingTab, Setting } from "obsidian";
import TGInbox from "./main";

export class TGInboxSettingTab extends PluginSettingTab {
    plugin: TGInbox;
    statusEl: HTMLDivElement;
    updateId: number;
  
    constructor(app: App, plugin: TGInbox) {
      super(app, plugin);
      this.plugin = plugin;
    }
  
    display(): void {
      const { containerEl } = this;
  
      containerEl.empty();
  
      const settingsContainer = containerEl.createDiv({
        cls: "tg-inbox-settings-container",
        attr: {
          style:
            "display: flex; justify-content: space-between; align-items: center;",
        },
      });
  
      const botSettingsSection = settingsContainer.createDiv();
      botSettingsSection.createEl("h2", { text: "Bot" });
  
      this.statusEl = settingsContainer.createDiv({
        cls: "tg-inbox-status",
        text: "❌ Bot disconnected",
      });
  
      this.updateStatus();
  
      this.updateId = window.setInterval(async () => {
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
  
      containerEl.createEl("h2", { text: "Message Formatting" });
  
      new Setting(containerEl)
        .setName("Bullet Points")
        .setDesc(
          "Enable bullet points for inserted messages. But it's not good to show code and quotes."
        )
        .addToggle((toggle) =>
          toggle.setValue(this.plugin.settings.bullet).onChange(async (value) => {
            this.plugin.settings.bullet = value;
            await this.plugin.saveSettings();
          })
        );
  
      new Setting(containerEl)
        .setName("Download Media")
        .setDesc("Whether to download media along with messages")
        .addToggle((toggle) =>
          toggle
            .setValue(this.plugin.settings.download_media)
            .onChange(async (value) => {
              this.plugin.settings.download_media = value;
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
    }
  
    hide() {
      window.clearInterval(this.updateId);
    }
    async updateStatus() {
      try {
        const me = await this.plugin.getBotInfo();
        if (me) {
          this.statusEl.setText(`✅ Bot connected as @${me.username}`);
        } else {
          this.statusEl.setText("❌ Bot not connected");
        }
      } catch {
        this.statusEl.setText("❌ Bot not connected");
      }
    }
  }
  