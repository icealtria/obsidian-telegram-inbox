import { type App, PluginSettingTab, Setting } from "obsidian";
import type TGInbox from "./main";
import * as Mustache from 'mustache';

export interface TGInboxSettings {
  token: string;
  marker: string;
  allow_users: string[];
  bullet: boolean;
  download_dir: string;
  download_media: boolean;
  message_template: string;
  markdown_escaper: boolean;
  is_custom_file: boolean;
  custom_file_path: string;
  disable_auto_reception: boolean;
}

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

    const botSettingsTitle = containerEl.createDiv({
      cls: "bot-settings-title",
    });

    new Setting(botSettingsTitle).setName('Bot').setHeading();

    this.statusEl = botSettingsTitle.createDiv({
      cls: "tg-inbox-status",
    });

    this.updateStatus();

    this.updateId = window.setInterval(async () => {
      await this.updateStatus();
    }, 5000);

    new Setting(containerEl)
      .setName("Bot token")
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
        "List of usernames or IDs of users whose messages will be received. Separate multiple entries with commas."
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

    new Setting(containerEl).setName("Message formatting").setHeading();

    new Setting(containerEl)
      .setName("Bullet points")
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
      .setName("Download media")
      .setDesc("Toggle to download media files along with messages.")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.download_media)
          .onChange(async (value) => {
            this.plugin.settings.download_media = value;
            await this.plugin.saveSettings();
            this.display();
          })
      );

    if (this.plugin.settings.download_media) {
      new Setting(containerEl)
        .setName("Download directory")
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

    new Setting(containerEl).setName("Advanced").setHeading();

    new Setting(containerEl)
      .setName("Disable automatic reception on Startup")
      .setDesc("If it is disabled, you will need to manually run commands to start bot or get updates.")
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settings.disable_auto_reception)
          .onChange(async (value) => {
            this.plugin.settings.disable_auto_reception = value;
            await this.plugin.saveSettings();
          });
      })

    new Setting(containerEl)
      .setName("Markdown escaper")
      .setDesc("Use Markdown escaper for text. For example: '[link](https://example.com)' will display as '[link](https://example.com)' instead of a link.")
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settings.markdown_escaper)
          .onChange(async (value) => {
            this.plugin.settings.markdown_escaper = value;
            await this.plugin.saveSettings();
          });
      });


    new Setting(containerEl)
      .setName("Save to custom path")
      .setDesc("Toggle to save messages to a custom path.")
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settings.is_custom_file)
          .onChange(async (value) => {
            this.plugin.settings.is_custom_file = value;
            await this.plugin.saveSettings();
            this.display();
          });
      })

    if (this.plugin.settings.is_custom_file) {
      new Setting(containerEl)
        .setName("Custom path")
        .setDesc("Specify the path for saving messages.")
        .addText((text) => {
          text.setPlaceholder("Default: Telegram-Inbox.md")
            .setValue(this.plugin.settings.custom_file_path)
            .onChange((value) => {
              this.plugin.settings.custom_file_path = value;
              this.plugin.saveSettings();
            })
        })
    }


    const message_template_desc = document.createDocumentFragment();
    message_template_desc.append("Customize the message template. ");
    const link = document.createElement("a")
    link.href = "https://github.com/icealtria/obsidian-telegram-inbox/wiki/Message-template"
    link.text = "Learn more";
    message_template_desc.append(link)


    new Setting(containerEl)
      .setName("Message template")
      .setDesc(message_template_desc)
      .addTextArea((textArea) => {
        textArea.inputEl.rows = 3;
        textArea.setValue(this.plugin.settings.message_template)
          .onChange(async (value) => {
            this.plugin.settings.message_template = value;
            await this.plugin.saveSettings();
          })
      }
      )
      .addButton((button) => {
        button.setButtonText("Validate").onClick(
          () => {
            try {
              Mustache.parse(this.plugin.settings.message_template);
              templateValidStatus.setText("✅ Template is valid");
            }
            catch (err) {
              console.error("Error parsing message template:", err);
              templateValidStatus.setText(`❌ Error parsing template: ${err.message}`);
            }
          }
        )
      });

    const templateValidStatus = containerEl.createDiv();
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
