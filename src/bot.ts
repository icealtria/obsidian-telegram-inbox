import { Bot, Composer } from "grammy";
import { App, Vault, moment, normalizePath } from "obsidian";
import { insertMessage } from "./io";
import {
  downloadAsArrayBuffer,
  getExt,
  getFileUrl,
  toBullet,
  toMarkdownV2,
} from "./utils";
import { TGInboxSettings } from "./type";

export class TelegramBot {
  bot: Bot;
  app: App;
  allowedUsers: string[];
  constructor(app: App, settings: TGInboxSettings) {
    // Restrict to allowed users
    const restrictToAllowedUsers = new Composer();
    restrictToAllowedUsers.use(async (ctx, next) => {
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
    // Start the bot
    this.bot = new Bot(settings.token);
    this.bot.use(restrictToAllowedUsers);
    this.app = app;

    // Commands
    this.bot.command("start", (ctx) => {
      ctx.reply(
        "Hello! Send me a message to add it to your Obsidian daily note.\n\nYou can also add tasks by using the command /task followed by the task description."
      );
    });

    this.bot.command("task", async (ctx) => {
      const task = `- [ ] ${ctx.match}`;
      insertMessage(this.app.vault, task);
      ctx.react("❤");
    });

    // Messages Handlers
    this.bot.on("message:text", async (ctx) => {
      const md = toMarkdownV2(ctx.message);
      const content = settings.bullet ? toBullet(md) : md;
      insertMessage(this.app.vault, content);
      ctx.react("❤");
    });

    this.bot.on("message:media", async (ctx) => {
      const md = toMarkdownV2(ctx.message);

      let content = md;
      if (settings.download_media) {
        const file = await ctx.getFile();
        const message_id = ctx.message.message_id;
        const dateStr = moment(ctx.message.date * 1000).format("YYYYMMDD");
        const extension = getExt(file.file_path || "");
        const filename_ext = `${dateStr}-${message_id}.${extension}`;
        const url = getFileUrl(file, this.bot.token);

        const downloadResult = await downloadFile(
          this.app.vault,
          url,
          filename_ext,
          settings.download_dir
        );

        if (downloadResult) {
          content = `![[${filename_ext}]]${md}`;
        } else {
          ctx.reply("Failed to download media");
        }
      }

      if (settings.bullet) {
        content = toBullet(content);
      }

      insertMessage(this.app.vault, content);
      ctx.react("❤");
    });

    this.bot.catch((err) => {
      console.error(err);
    });
  }

  start() {
    this.bot.start({});
  }
}

async function downloadFile(
  vault: Vault,
  url: string,
  filename_ext: string,
  download_dir: string
) {
  try {
    const fileArrayBuffer = await downloadAsArrayBuffer(url);
    vault.createBinary(
      normalizePath(`${download_dir}/${filename_ext}`),
      fileArrayBuffer
    );
    return true;
  } catch (error) {
    console.error("Error downloading file:", error);
    return false;
  }
}
