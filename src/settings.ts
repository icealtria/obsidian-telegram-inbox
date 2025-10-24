import { type App, PluginSettingTab, Setting } from "obsidian";
import type TGInbox from "./main";
import * as Mustache from 'mustache';
import { getSyncStatus, hasSyncPlugin } from "./utils/sync";

export interface TGInboxSettings {
  token: string;
  marker: string;
  allow_users: string[];
  download_dir: string;
  download_media: boolean;
  message_template: string;
  markdown_escaper: boolean;
  is_custom_file: boolean;
  custom_file_path: string;
  disable_auto_reception: boolean;
  reverse_order: boolean;
  remove_formatting: boolean;
  run_after_sync: boolean;
  daily_note_time_cutoff: string; // Format: "HH:MM" (24-hour format)
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
          this.plugin.initBot();
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

    const message_template_desc = document.createDocumentFragment();
    message_template_desc.append("Customize the message template. ");
    const message_template_wiki = document.createElement("a")
    message_template_wiki.href = "https://github.com/icealtria/obsidian-telegram-inbox/wiki/Message-template"
    message_template_wiki.text = "Learn more";
    message_template_desc.append(message_template_wiki)


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
              templateValidStatus.setText("✅ Template format is correct. This is to ensure that the program does not crash, doesn't mean the fields are correct.");
            }
            catch (err) {
              console.error("Error parsing message template:", err);
              templateValidStatus.setText(`❌ Error parsing template: ${err.message}`);
            }
          }
        )
      });

    const templateValidStatus = containerEl.createDiv();

    new Setting(containerEl).setName("Advanced").setHeading();

    new Setting(containerEl)
      .setName("Reverse order")
      .setDesc("Reverse the order of messages. This is useful if you want to see the latest messages first.")
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settings.reverse_order)
          .onChange(async (value) => {
            this.plugin.settings.reverse_order = value;
            await this.plugin.saveSettings();
          });
      })

    new Setting(containerEl)
      .setName("Disable automatically receiving on Startup")
      .setDesc("If it is disabled, you will need to manually run a command to start bot or get updates.")
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settings.disable_auto_reception)
          .onChange(async (value) => {
            this.plugin.settings.disable_auto_reception = value;
            await this.plugin.saveSettings();
          });
      })

    new Setting(containerEl)
      .setName("Remove text formatting")
      .setDesc(createFragment((fragment) => {
        fragment.append(
          "Remove text formatting like ",
          createEl("b", { text: "bold" }), ", ",
          createEl("i", { text: "italic" }), ", ",
          createEl("s", { text: "strikethrough" }), " etc."
        );
      }))
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settings.remove_formatting)
          .onChange(async (value) => {
            this.plugin.settings.remove_formatting = value;
            await this.plugin.saveSettings();
            this.display();
          });
      })

    const markdownEscaperDisabled = this.plugin.settings.remove_formatting;
    const markdownEscaper = new Setting(containerEl)
      .setName("Markdown escaper")
      .setDesc("Use Markdown escaper for text. For example: '[link](https://example.com)' will display as '[link](https://example.com)' instead of a link.")
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settings.markdown_escaper)
          .onChange(async (value) => {
            this.plugin.settings.markdown_escaper = value;
            await this.plugin.saveSettings();
          });
      });

    if (markdownEscaperDisabled) {
      markdownEscaper.setClass("tg-inbox-setting-disabled");
    }

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

    const custom_path_desc = document.createDocumentFragment();
    custom_path_desc.append("Specify the path for saving messages. ");
    const custom_path_wiki = document.createElement("a")
    custom_path_wiki.href = "https://github.com/icealtria/obsidian-telegram-inbox/wiki/Custom-path"
    custom_path_wiki.text = "Learn more";
    custom_path_desc.append(custom_path_wiki)


    if (this.plugin.settings.is_custom_file) {
      new Setting(containerEl)
        .setName("Custom path")
        .setDesc(custom_path_desc)
        .addText((text) => {
          text.setPlaceholder("Default: Telegram-Inbox.md")
            .setValue(this.plugin.settings.custom_file_path)
            .onChange((value) => {
              this.plugin.settings.custom_file_path = value;
              this.plugin.saveSettings();
            })
        })
    } else {
      // Daily note time cutoff setting
      const timeCutoffSetting = new Setting(containerEl)
        .setName("Daily note time cutoff")
        .setDesc("Set the time cutoff for daily notes. Messages received before this time will be saved to the previous day's note. Format: HH:MM (24-hour)")
        .addText((text) => {
          text.setPlaceholder("00:00")
            .setValue(this.plugin.settings.daily_note_time_cutoff)
            .onChange((value) => {
              this.validateAndSetTimeCutoff(value, text.inputEl, timeCutoffSetting);
            });
        });
    }


    const runAfterSyncSetting = new Setting(containerEl)
      .setName("Run after vault synced")
      .setDesc("Run the bot after Obsidian sync is complete on startup.")
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settings.run_after_sync)
          .onChange(async (value) => {
            this.plugin.settings.run_after_sync = value;
            await this.plugin.saveSettings();
          });
      });


    if (!hasSyncPlugin(this.app)) {
      runAfterSyncSetting.setDesc("This setting requires Obsidian Sync or Remotely plugin to be installed.");
      runAfterSyncSetting.setDisabled(true);
      runAfterSyncSetting.setClass("tg-inbox-setting-disabled");
    }

    const { obsidianSync, remotelySave, remotelySync } = getSyncStatus(this.app);
    const syncStatusDiv = containerEl.createDiv({ cls: "tg-inbox-sync-status" });
    if (obsidianSync) {
      syncStatusDiv.createDiv({ text: "Obsidian Sync: enabled" });
    }
    if (remotelySave) {
      syncStatusDiv.createDiv({ text: "Remotely Save: enabled" });
    }
    if (remotelySync) {
      syncStatusDiv.createDiv({ text: "Remotely Sync: enabled" });
    }
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

  private validateAndSetTimeCutoff(value: string, inputEl: HTMLInputElement, setting: Setting) {
    const timeRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;
    const isValid = timeRegex.test(value);
    
    if (isValid) {
      // Valid time format
      inputEl.classList.remove("tg-inbox-time-input-error");
      this.removeErrorText(setting);
      this.plugin.settings.daily_note_time_cutoff = value;
      this.plugin.saveSettings();
    } else {
      // Invalid time format
      inputEl.classList.add("tg-inbox-time-input-error");
      this.showErrorText(setting, "Invalid time format. Please use HH:MM format (00:00-23:59)");
    }
  }

  private showErrorText(setting: Setting, message: string) {
    // Remove existing error text
    this.removeErrorText(setting);
    
    // Add error text
    const errorDiv = setting.descEl.createDiv({
      cls: "tg-inbox-error-text",
      text: message
    });
    errorDiv.style.color = "#ff6b6b";
    errorDiv.style.fontSize = "0.8em";
    errorDiv.style.marginTop = "4px";
  }

  private removeErrorText(setting: Setting) {
    const existingError = setting.descEl.querySelector(".tg-inbox-error-text");
    if (existingError) {
      existingError.remove();
    }
  }
}
