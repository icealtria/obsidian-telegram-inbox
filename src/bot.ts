import { Bot, Composer } from "grammy";
import { App, Vault, moment, normalizePath } from "obsidian";
import { insertMessage } from "./io";
import { toMarkdownV2 } from "@telegraf/entity";
import { downloadAsArrayBuffer, getExt, getFileUrl, toBullet } from "./utils";
import { MyPluginSettings } from "./type";

export class TelegramBot {
  bot: Bot;
  app: App;
  allowedUsers: string[];
  constructor(app: App, settings: MyPluginSettings) {
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

    this.bot = new Bot(settings.token);
    this.bot.use(restrictToAllowedUsers);
    this.app = app;

    this.bot.on("message:text", async (ctx) => {
      if (ctx.from?.id) {
        const md = toMarkdownV2({
          text: ctx.message.text,
          entities: ctx.message.entities?.filter((e) => e.type != "url"),
        });
        const content = settings.bullet ? toBullet(md) : md;
        insertMessage(this.app.vault, content);
        ctx.react("❤");
      }
    });

    this.bot.on("message:media", async (ctx) => {
      if (ctx.from?.id) {
        const md = toMarkdownV2({
          caption: ctx.message.caption,
          entities: ctx.message.caption_entities?.filter(
            (e) => e.type != "url"
          ),
        });

        if (settings.download_media) {
          const file = await ctx.getFile();
          const message_id = ctx.message.message_id;
          const date = new Date(ctx.message.date * 1000);
          const dateStr = moment(date).format("YYYYMMDD");
          const filename = `${dateStr}-${message_id}`;
          const url = getFileUrl(file, this.bot.token);
          const extension = getExt(file.file_path || "");
          const filename_ext = `${filename}.${extension}`;

          await downloadFile(
            this.app.vault,
            url,
            filename_ext,
            settings.download_dir
          );
          const content = settings.bullet
            ? toBullet(`![[${filename_ext}]]${md}`)
            : `![[${filename_ext}]]${md}`;
          insertMessage(this.app.vault, content);
        } else {
          const content = settings.bullet ? toBullet(md) : md;
          insertMessage(this.app.vault, content);
        }

        ctx.react("❤");
      }
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
): Promise<string> {
  const fileArrayBuffer = await downloadAsArrayBuffer(url);
  vault.createBinary(
    normalizePath(`${download_dir}/${filename_ext}`),
    fileArrayBuffer
  );
  return filename_ext;
}
