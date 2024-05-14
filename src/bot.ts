import { Bot, Composer, type Context } from "grammy";
import { type Vault, moment } from "obsidian";
import { insertMessage } from "./io";
import type { TGInboxSettings } from "./settings";
import { downloadAndSaveFile } from "./utils/download";
import type { File, Message } from "grammy/types";
import { generateContentFromTemplate } from "./utils/template";
import { toBullet } from "./utils/format";
import { getExt, getFileUrl } from "./utils/file";


export class TelegramBot {
  bot: Bot;
  vault: Vault;
  allowedUsers: string[];

  constructor(vault: Vault, settings: TGInboxSettings) {

    const restrictToAllowedUsers = this.createRestrictToAllowedUsersMiddleware(settings);

    this.bot = new Bot(settings.token);
    this.bot.use(restrictToAllowedUsers);
    this.vault = vault;

    this.setupCommands();

    this.setupMessageHandlers(settings);

    this.bot.catch((err) => {
      console.error(err);
    });
  }

  start() {
    this.bot.start({});
  }

  private createRestrictToAllowedUsersMiddleware(settings: TGInboxSettings): Composer<Context> {
    return new Composer().use(async (ctx: Context, next) => {
      const userId = ctx.from?.id;
      const username = ctx.from?.username;

      if (
        (username && settings.allow_users.includes(username)) ||
        (userId && settings.allow_users.includes(userId.toString()))
      ) {
        await next();
      } else {
        console.log("Unauthorized user:", username || userId);
      }
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
    this.bot.on("message:text", async (ctx) => {
      const content = generateContentFromTemplate(ctx.msg, settings)
      const finalContent = settings.bullet ? toBullet(content) : content;
      this.insertMessageToVault(finalContent);
      ctx.react("❤");
    });

    this.bot.on("message:media", async (ctx) => {
      let content = generateContentFromTemplate(ctx.message, settings);

      if (settings.download_media) {
        const file = await ctx.getFile();
        const filename_ext = this.generateFilename(ctx.message, file);
        const url = getFileUrl(file, this.bot.token);

        const downloadResult = await downloadAndSaveFile(url, filename_ext, settings.download_dir);

        if (downloadResult) {
          content = `![[${filename_ext}]]${content}`;
        } else {
          ctx.reply("Failed to download media");
        }
      }

      if (settings.bullet) {
        content = toBullet(content);
      }

      this.insertMessageToVault(content);
      ctx.react("❤");
    });
  }

  private generateFilename(msg: Message, file: File): string {
    const message_id = msg.message_id;
    const dateStr = moment(msg.date * 1000).format("YYYYMMDD");
    const extension = getExt(file.file_path || "");
    return `${dateStr}-${message_id}.${extension}`;
  }

  private insertMessageToVault(content: string) {
    insertMessage(this.vault, content);
  }
}
