import { Bot, Composer, Context } from "grammy";
import { App, moment } from "obsidian";
import { insertMessage } from "./io";
import { getExt, getFileUrl, toBullet, toMarkdownV2 } from "./utils";
import { TGInboxSettings } from "./type";
import { downloadAndSaveFile } from "./download";
import { File, Message } from "grammy/types";

export class TelegramBot {
  bot: Bot;
  app: App;
  allowedUsers: string[];

  constructor(app: App, settings: TGInboxSettings) {

    const restrictToAllowedUsers = this.createRestrictToAllowedUsersMiddleware(settings);

    this.bot = new Bot(settings.token);
    this.bot.use(restrictToAllowedUsers);
    this.app = app;

    this.setupCommands();

    this.setupMessageHandlers(settings);

    this.bot.catch((err) => {
      console.error(err);
    });
  }

  start() {
    this.bot.start({});
  }

  private createRestrictToAllowedUsersMiddleware(settings: TGInboxSettings): Composer<any> {
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
        "Hello! Send me a message to add it to your Obsidian daily note.\n\nYou can also add tasks by using the command /task followed by the task description."
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
      const md = toMarkdownV2(ctx.message);
      let content = settings.bullet ? toBullet(md) : md;
      this.insertMessageToVault(content);
      ctx.react("❤");
    });

    this.bot.on("message:media", async (ctx) => {
      const md = toMarkdownV2(ctx.message);
      let content = md;

      if (settings.download_media) {
        const file = await ctx.getFile();
        const filename_ext = this.generateFilename(ctx.message, file);
        const url = getFileUrl(file, this.bot.token);

        const downloadResult = await downloadAndSaveFile(url, filename_ext, settings.download_dir);

        if (downloadResult) {
          content = `![[${filename_ext}]]${md}`;
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
    const extension = getExt(file.file_path || "");;
    return `${dateStr}-${message_id}.${extension}`;
  }

  private insertMessageToVault(content: string) {
    insertMessage(this.app.vault, content);
  }
}
