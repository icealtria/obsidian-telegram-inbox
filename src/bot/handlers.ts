import { type Bot, type Context } from "grammy";
import type { TGInboxSettings } from "../settings/types";
import { generateContentFromTemplate } from "../utils/template";
import { downloadAndSaveFile } from "../utils/download";
import { getFileUrl } from "../utils/file";
import type { VaultWriter } from "./vault-writer";
import { generateFilename } from "./utils";
import type { MessageUpdate } from "../type";
import { RuntimeStateStore } from "../state";

type SupportedMediaType = "voice" | "audio" | "photo" | "video" | "document" | "other";

/**
 * Applies post-processing acknowledgement behavior after successful ingestion.
 * Falls back from delete to reaction when bot permissions are insufficient.
 */
async function executePostAction(ctx: Context, settings: TGInboxSettings): Promise<void> {
  if (settings.action_after_reception === "quiet") {
    return;
  }

  if (settings.action_after_reception === "delete") {
    try {
      await ctx.deleteMessage();
      return;
    } catch (err) {
      console.warn("Failed to delete message, falling back to reaction:", err);
    }
  }

  try {
    await ctx.react("❤");
  } catch (err) {
    console.error("Failed to set reaction:", err);
  }
}

function handleVaultError(ctx: Context, err: Error, context: string): void {
  console.error(`Failed to ${context}. Error: ${err.message}`, err);
  ctx.reply(`Failed to ${context}. Error: ${err.message}`);
}

/** Detects a normalized media type from Telegram message payload fields. */
function getMediaType(msg: MessageUpdate): SupportedMediaType {
  if ("voice" in msg && msg.voice) {
    return "voice";
  }
  if ("audio" in msg && msg.audio) {
    return "audio";
  }
  if ("photo" in msg && msg.photo) {
    return "photo";
  }
  if ("video" in msg && msg.video) {
    return "video";
  }
  if ("document" in msg && msg.document) {
    return "document";
  }
  return "other";
}

/** Resolves whether a media payload should be processed by current filters. */
function isMediaEnabled(settings: TGInboxSettings, mediaType: SupportedMediaType): boolean {
  switch (mediaType) {
    case "voice":
      return settings.media_filter_voice;
    case "audio":
      return settings.media_filter_audio;
    case "photo":
      return settings.media_filter_photo;
    case "video":
      return settings.media_filter_video;
    case "document":
      return settings.media_filter_document;
    case "other":
    default:
      return true;
  }
}

/** Persists dedupe bookkeeping after successful processing. */
async function persistProcessedMessage(
  runtimeStateStore: RuntimeStateStore,
  msg: MessageUpdate,
  updateId?: number
): Promise<void> {
  const messageKey = runtimeStateStore.buildMessageKey(msg);
  await runtimeStateStore.markProcessed(messageKey, updateId);
}

/** Enqueues failed writes for later retry with persistent metadata. */
async function queueRetry(
  runtimeStateStore: RuntimeStateStore,
  msg: MessageUpdate,
  content: string,
  updateId: number | undefined,
  error: Error
): Promise<void> {
  const messageKey = runtimeStateStore.buildMessageKey(msg);
  await runtimeStateStore.enqueueRetry({
    messageKey,
    updateId,
    msg,
    content,
    error: error.message,
  });
}

/** True when the message key already exists in persistent dedupe state. */
function shouldSkipAlreadyProcessed(
  runtimeStateStore: RuntimeStateStore,
  msg: MessageUpdate
): boolean {
  const messageKey = runtimeStateStore.buildMessageKey(msg);
  return runtimeStateStore.hasProcessed(messageKey);
}

export function setupCommands(
  bot: Bot,
  settings: TGInboxSettings,
  vaultWriter: VaultWriter,
  runtimeStateStore: RuntimeStateStore
) {
  bot.command("start", (ctx) => {
    ctx.reply(
      "Hello! Send me a message to add it to your Obsidian daily note.\n\n/task followed by the description will add it as a task item."
    );
  });

  bot.command("task", async (ctx) => {
    const msg = ctx.msg as MessageUpdate;
    if (shouldSkipAlreadyProcessed(runtimeStateStore, msg)) {
      await persistProcessedMessage(runtimeStateStore, msg, ctx.update?.update_id);
      return;
    }
    const task = `- [ ] ${ctx.match}`;
    try {
      await vaultWriter.insertMessageToVault(task, msg);
      await persistProcessedMessage(runtimeStateStore, msg, ctx.update?.update_id);
      await executePostAction(ctx, settings);
    } catch (err) {
      await queueRetry(
        runtimeStateStore,
        msg,
        task,
        ctx.update?.update_id,
        err as Error
      );
      handleVaultError(ctx, err as Error, "insert task");
    }
  });
}

export function setupMessageHandlers(
  bot: Bot,
  settings: TGInboxSettings,
  vaultWriter: VaultWriter,
  runtimeStateStore: RuntimeStateStore
) {
  bot.on(["message:text", "channel_post:text"], async (ctx) => {
    const msg = ctx.msg as MessageUpdate;
    if (shouldSkipAlreadyProcessed(runtimeStateStore, msg)) {
      await persistProcessedMessage(runtimeStateStore, msg, ctx.update?.update_id);
      return;
    }
    const content = generateContentFromTemplate(msg, settings);

    try {
      await vaultWriter.insertMessageToVault(content, msg);
      await persistProcessedMessage(runtimeStateStore, msg, ctx.update?.update_id);
      await executePostAction(ctx, settings);
    } catch (err) {
      await queueRetry(
        runtimeStateStore,
        msg,
        content,
        ctx.update?.update_id,
        err as Error
      );
      handleVaultError(ctx, err as Error, "insert text message to vault");
    }
  });

  bot.on(["message:media", "channel_post:media"], async (ctx) => {
    const msg = ctx.msg as MessageUpdate;
    if (shouldSkipAlreadyProcessed(runtimeStateStore, msg)) {
      await persistProcessedMessage(runtimeStateStore, msg, ctx.update?.update_id);
      return;
    }
    const mediaType = getMediaType(msg);
    if (!isMediaEnabled(settings, mediaType)) {
      console.debug(`Skipping media type '${mediaType}' due to filter setting.`);
      return;
    }

    let content = generateContentFromTemplate(msg, settings);

    try {
      if (settings.download_media) {
        const file = await ctx.getFile();
        const filename_ext = generateFilename(msg, file);
        const url = getFileUrl(file, bot.token);

        console.debug(`Attempting to download media: ${filename_ext} from ${url}`);
        const downloadResult = await downloadAndSaveFile(
          vaultWriter.getVault(),
          url,
          filename_ext,
          settings.download_dir
        );

        if (downloadResult) {
          content = `![[${filename_ext}]]\n${content}`;
        } else {
          console.error(`Failed to download media. File: ${filename_ext}, URL: ${url}`);
          ctx.reply(`Failed to download media. File: ${filename_ext}, URL: ${url}`);
        }
      }

      if (!settings.download_media && content.length === 0) {
        console.debug("No content to insert. Skipping.");
        return;
      }

      await vaultWriter.insertMessageToVault(content, msg);
      await persistProcessedMessage(runtimeStateStore, msg, ctx.update?.update_id);
      await executePostAction(ctx, settings);
    } catch (err) {
      await queueRetry(
        runtimeStateStore,
        msg,
        content,
        ctx.update?.update_id,
        err as Error
      );
      handleVaultError(ctx, err as Error, "insert media message to vault");
    }
  });
}
