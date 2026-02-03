import { type Bot, type Context } from "grammy";
import type { TGInboxSettings } from "../settings/types";
import { generateContentFromTemplate } from "../utils/template";
import { downloadAndSaveFile } from "../utils/download";
import { getFileUrl } from "../utils/file";
import type { VaultWriter } from "./vault-writer";
import { generateFilename } from "./utils";
import type { MessageUpdate } from "../type";

async function sendReaction(ctx: Context): Promise<void> {
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

export function setupCommands(bot: Bot, vaultWriter: VaultWriter) {
  bot.command("start", (ctx) => {
    ctx.reply(
      "Hello! Send me a message to add it to your Obsidian daily note.\n\n/task followed by the description will add it as a task item."
    );
  });

  bot.command("task", async (ctx) => {
    const task = `- [ ] ${ctx.match}`;
    try {
      await vaultWriter.insertMessageToVault(task, ctx.msg as MessageUpdate);
      await sendReaction(ctx);
    } catch (err) {
      handleVaultError(ctx, err as Error, "insert task");
    }
  });
}

export function setupMessageHandlers(bot: Bot, settings: TGInboxSettings, vaultWriter: VaultWriter) {
  bot.on(["message:text", "channel_post:text"], async (ctx) => {
    const msg = ctx.msg as MessageUpdate;
    const content = generateContentFromTemplate(msg, settings);
    
    try {
      await vaultWriter.insertMessageToVault(content, msg);
      await sendReaction(ctx);
    } catch (err) {
      handleVaultError(ctx, err as Error, "insert text message to vault");
    }
  });

  bot.on(["message:media", "channel_post:media"], async (ctx) => {
    const msg = ctx.msg as MessageUpdate;
    let content = generateContentFromTemplate(msg, settings);

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

    try {
      await vaultWriter.insertMessageToVault(content, msg);
      await sendReaction(ctx);
    } catch (err) {
      handleVaultError(ctx, err as Error, "insert media message to vault");
    }
  });
}
