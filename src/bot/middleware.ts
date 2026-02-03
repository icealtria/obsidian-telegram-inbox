import { Composer, type Context } from "grammy";
import type { TGInboxSettings } from "../settings/types";

const ALLOWED_CHAT_TYPES = ["private", "channel", "supergroup"] as const;

function isAllowedChatType(type: string): type is typeof ALLOWED_CHAT_TYPES[number] {
  return ALLOWED_CHAT_TYPES.includes(type as typeof ALLOWED_CHAT_TYPES[number]);
}

function isAuthorizedUser(
  settings: TGInboxSettings,
  userId: number | undefined,
  username: string | undefined
): boolean {
  if (username && settings.allow_users.includes(username)) {
    return true;
  }
  if (userId && settings.allow_users.includes(userId.toString())) {
    return true;
  }
  return false;
}

export function createRestrictToAllowedUsersMiddleware(
  settings: TGInboxSettings
): Composer<Context> {
  return new Composer().use(async (ctx: Context, next) => {
    const chat = ctx.chat;

    if (!chat || !isAllowedChatType(chat.type)) {
      console.log("Unauthorized chat type:", chat?.type, chat?.id);
      return;
    }

    const userId = chat.id;
    const username = chat.username;

    if (isAuthorizedUser(settings, userId, username)) {
      await next();
    } else {
      console.log(
        `Unauthorized access attempt: User ${username || userId} tried to access the bot at ${new Date().toISOString()}`
      );
    }
  });
}

export function createRecordUpdateIdMiddleware(
  updateIdCallback: (updateId: number) => void
): Composer<Context> {
  return new Composer().use(async (ctx: Context, next) => {
    const updateId = ctx.update?.update_id;
    if (updateId) {
      updateIdCallback(updateId);
    }
    await next();
  });
}
