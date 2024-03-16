import { Bot } from "grammy";
import { App } from "obsidian";
import { insertMessage } from "./io";
import { toMarkdownV2 } from "@telegraf/entity";
import { toBullet } from "./utils";

export class TelegramBot {
  bot: Bot;
  app: App;
  constructor(app: App, token: string) {
    this.bot = new Bot(token);
    this.app = app;

    this.bot.on("message:text", async (ctx) => {
      const md = toMarkdownV2({
        text: ctx.message.text,
        entities: ctx.message.entities?.filter((e) => e.type != "url"),
      });
      const content = toBullet(md);
      insertMessage(this.app.vault, content);
      ctx.react("❤");
    });
  }

  start() {
    this.bot.start({});
  }
}
