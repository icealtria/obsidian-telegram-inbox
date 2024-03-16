import { Bot, Composer } from "grammy";
import { App } from "obsidian";
import { insertMessage } from "./io";
import { toMarkdownV2 } from "@telegraf/entity";
import { toBullet } from "./utils";

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

    this.bot = new Bot(token);
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
  }

  start() {
    this.bot.start({});
  }
}
