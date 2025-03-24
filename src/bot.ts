import { Bot, Composer, type Context } from "grammy";
import { type Vault, moment } from "obsidian";
import { insertMessage, insertMessageAtTop } from "./io";
import type { TGInboxSettings } from "./settings";
import { downloadAndSaveFile } from "./utils/download";
import type { File, Message } from "grammy/types";
import { generateContentFromTemplate } from "./utils/template";
import { getExt, getFileUrl, getSavePath } from "./utils/file";
import { Mutex } from "async-mutex";
import { MessageUpdate } from "./type";

export class TelegramBot {
  bot: Bot;
  vault: Vault;
  allowedUsers: string[];
  settings: TGInboxSettings;
  update_id: number;
  mutex = new Mutex();

  constructor(vault: Vault, settings: TGInboxSettings) {

    const restrictToAllowedUsers = this.createRestrictToAllowedUsersMiddleware(settings);
    const recordUpdateId = this.createRecordUpdateIdMiddleware();

    this.bot = new Bot(settings.token);

    if (settings.disable_auto_reception) {
      this.bot.init();
    }

    this.bot.use(restrictToAllowedUsers);
    this.bot.use(recordUpdateId);
    this.vault = vault;
    this.settings = settings;

    this.setupCommands();

    this.setupMessageHandlers(settings);

    this.bot.catch((err) => {
      console.error("An error occurred in the Telegram bot:", err);
    });
  }

  start() {
    this.bot.start();
  }

  async getUpdates() {
    const offset = this.update_id ? this.update_id + 1 : 1;
    const updates = await this.bot.api.getUpdates({ offset });
    updates.map(async (update) => await this.bot.handleUpdate(update));
    if (updates.length > 0) {
      this.bot.api.getUpdates({ offset: this.update_id + 1, limit: 1 });
    }
  }

  private createRestrictToAllowedUsersMiddleware(settings: TGInboxSettings): Composer<Context> {
    return new Composer().use(async (ctx: Context, next) => {
      if (!ctx.chat || (ctx.chat.type !== 'private' && ctx.chat.type !== 'channel' && ctx.chat.type !== 'supergroup')) {
        console.log('Unauthorized chat type:', ctx.chat?.type, ctx.chat?.id);
        return;
      }
      const userId = ctx.chat?.id;
      const username = ctx.chat?.username;
      if (
        (username && settings.allow_users.includes(username)) ||
        (userId && settings.allow_users.includes(userId.toString()))
      ) {
        await next();
      } else {
        console.log(`Unauthorized access attempt: User ${username || userId} tried to access the bot at ${new Date().toISOString()}`);
      }
    });
  }

  createRecordUpdateIdMiddleware(): Composer<Context> {
    return new Composer().use(async (ctx: Context, next) => {
      const updateId = ctx.update?.update_id;
      if (updateId) {
        this.update_id = updateId;
      }
      await next();
    });
  }

  private setupCommands() {
    this.bot.command("start", (ctx) => {
      ctx.reply(
        "Hello! Send me a message to add it to your Obsidian daily note.\n\n/task followed by the description will add it as a task item."
      );
    });

    this.bot.command("task", async (ctx) => {
      const task = `- [ ] ${ctx.match}`;
      this.insertMessageToVault(task);
      ctx.react("❤");
    });
  }

  private setupMessageHandlers(settings: TGInboxSettings) {
    this.bot.on(["message:text", "channel_post:text"], async (ctx) => {
      const content = generateContentFromTemplate(ctx.msg, settings)
      await this.insertMessageToVault(content, { msg: ctx.msg })
        .then(async _ => {
          try {
            await ctx.react("❤");
          } catch (reactionErr) {
            console.error("Failed to set reaction");
          }
        })
        .catch((err) => {
          console.error(`Failed to insert text message to vault. Error: ${err.message}`, err);
          ctx.reply(`Failed to insert text message to vault. Error: ${err.message}`, err);
        });
    });

    this.bot.on(["message:media", "channel_post:media"], async (ctx) => {
      let content = generateContentFromTemplate(ctx.msg, settings);

      if (settings.download_media) {
        const file = await ctx.getFile();
        const filename_ext = this.generateFilename(ctx.msg, file);
        const url = getFileUrl(file, this.bot.token);

        console.debug(`Attempting to download media: ${filename_ext} from ${url}`);
        const downloadResult = await downloadAndSaveFile(url, filename_ext, settings.download_dir);

        if (downloadResult) {
          content = `![[${filename_ext}]]\n${content}`;
        } else {
          console.error(`Failed to download media. File: ${filename_ext}, URL: ${url}`);
          ctx.reply(`Failed to download media. File: ${filename_ext}, URL: ${url}`);
        }
      }

      if (!settings.download_media && content.length === 0) {
        console.debug("No content to insert. Skipping.");
        return;
      }

      await this.insertMessageToVault(content, { msg: ctx.msg })
        .then(async _ => {
          try {
            await ctx.react("❤");
          } catch (reactionErr) {
            console.error("Failed to set reaction");
          }
        })
        .catch((err) => {
          console.error(`Failed to insert media message to vault. Error: ${err.message}`, err);
          ctx.reply(`Failed to insert media message to vault. Error: ${err.message}`, err);
        });
    });
  }

  private generateFilename(msg: Message, file: File): string {
    const message_id = msg.message_id;
    const dateStr = moment(msg.date * 1000).format("YYYYMMDD");
    const extension = getExt(file.file_path || "");
    return `${dateStr}-${message_id}.${extension}`;
  }

  private async insertMessageToVault(content: string, options?: { msg: MessageUpdate }): Promise<void> {
    const release = await this.mutex.acquire();
    try {
      const savedPath = options?.msg
        ? await getSavePath(this.vault, this.settings, options.msg)
        : await getSavePath(this.vault, this.settings);

      if (this.settings.reverse_order) {
        await insertMessageAtTop(this.vault, content, savedPath);
      } else {
        await insertMessage(this.vault, content, savedPath);
      }
    } catch (error) {
      console.error(`Error inserting message to vault: ${error}`);
      throw error;
    } finally {
      release();
    }
  }
}
