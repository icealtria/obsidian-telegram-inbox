import { Bot, Composer, Context } from "grammy";
import { App, Vault, moment } from "obsidian";
import { insertMessage } from "./io";
import { toMarkdownV2 } from "@telegraf/entity";
import { toBullet } from "./utils";

import { FileFlavor, hydrateFiles } from "@grammyjs/files";
import { File } from "grammy/types";

import * as fs from "fs";
import { MyPluginSettings } from "./type";
type MyContext = FileFlavor<Context>;

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

    this.bot = new Bot<MyContext>(settings.token);
    this.bot.api.config.use(hydrateFiles(this.bot.token));
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
      console.log(ctx.message);
      if (ctx.from?.id) {
        const md = toMarkdownV2({
          caption: ctx.message.caption,
          entities: ctx.message.caption_entities?.filter(
            (e) => e.type != "url"
          ),
        });

        if (settings.download_media) {
          const file = await ctx.getFile();
          console.log(file);
          const message_id = ctx.message.message_id;
          const date = new Date(ctx.message.date * 1000);
          const dateStr = moment(date).format("YYYYMMDD");
          const filename = `${dateStr}-${message_id}`;
          const filename_ext = await downloadFile(
            this.app.vault,
            file,
            filename,
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
  file: File,
  filename: string,
  download_dir: string
): Promise<string> {
  const path = await file.download();
  console.log("downloaded file, cached at", path);
  const data = fs.readFileSync(path);

  const extension = getExt(file.file_path || "");
  const savePath = `${download_dir}/${filename}.${extension}`;
  const saveFile = await vault.createBinary(savePath, data);

  return saveFile.name;
}

function getExt(path: string) {
  return path.split(".").pop();
}
