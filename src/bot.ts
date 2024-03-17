import { Bot, Composer, Context } from "grammy";
import { App, Vault, normalizePath, moment } from "obsidian";
import { insertMessage } from "./io";
import { toMarkdownV2 } from "@telegraf/entity";
import { toBullet } from "./utils";

import { FileFlavor, hydrateFiles } from "@grammyjs/files";
import { File } from "grammy/types";

import * as fs from "fs";
type MyContext = FileFlavor<Context>;

export class TelegramBot {
  bot: Bot;
  app: App;
  allowedUsers: string[];
  constructor(app: App, token: string, allowedUsers: string[]) {
    this.allowedUsers = allowedUsers;
    const restrictToAllowedUsers = new Composer();
    restrictToAllowedUsers.use(async (ctx, next) => {
      const userId = ctx.from?.id;
      const username = ctx.from?.username;

      if (
        (username && this.allowedUsers.includes(username)) ||
        (userId && this.allowedUsers.includes(userId.toString()))
      ) {
        await next();
      } else {
        console.log("Unauthorized user:", username || userId);
      }
    });

    this.bot = new Bot<MyContext>(token);
    this.bot.api.config.use(hydrateFiles(this.bot.token));
    this.bot.use(restrictToAllowedUsers);
    this.app = app;

    this.bot.on("message:text", async (ctx) => {
      if (ctx.from?.id) {
        const md = toMarkdownV2({
          text: ctx.message.text,
          entities: ctx.message.entities?.filter((e) => e.type != "url"),
        });
        const content = toBullet(md);
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
        console.log(md);
        const file = await ctx.getFile();
        console.log(file);

        const message_id = ctx.message.message_id;

        const date = new Date(ctx.message.date * 1000);
        const dateStr = moment(date).format("YYYYMMDD");

        const filename = `${dateStr}-${message_id}`;

        const filename_ext = await downloadFile(this.app.vault, file, filename);

        const content = toBullet(`![[${filename_ext}]]${md}`);

        insertMessage(this.app.vault, content);
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
  filename: string
): Promise<string> {
  const path = await file.download();
  console.log("downloaded file, cached at", path);
  const data = fs.readFileSync(path);

  const extension = getExt(file.file_path || "");
  const savePath = `${filename}.${extension}`;
  const saveFile = await vault.createBinary(savePath, data);

  return saveFile.name;
}

function getExt(path: string) {
  return path.split(".").pop();
}
