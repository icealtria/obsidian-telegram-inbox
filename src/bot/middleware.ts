import { Composer, type Context } from "grammy";
import type { TGInboxSettings } from "../settings/types";

export function createRestrictToAllowedUsersMiddleware(settings: TGInboxSettings): Composer<Context> {
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

export function createRecordUpdateIdMiddleware(updateIdCallback: (updateId: number) => void): Composer<Context> {
  return new Composer().use(async (ctx: Context, next) => {
    const updateId = ctx.update?.update_id;
    if (updateId) {
      updateIdCallback(updateId);
    }
    await next();
  });
}
