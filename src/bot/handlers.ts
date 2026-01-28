import { type Bot } from "grammy";
import type { TGInboxSettings } from "../settings/types";
import { generateContentFromTemplate } from "../utils/template";
import { downloadAndSaveFile } from "../utils/download";
import { getFileUrl } from "../utils/file";
import type { VaultWriter } from "./vault-writer";
import { generateFilename } from "./utils";
import type { MessageUpdate } from "../type";

export function setupCommands(bot: Bot, vaultWriter: VaultWriter) {
  bot.command("start", (ctx) => {
    ctx.reply(
      "Hello! Send me a message to add it to your Obsidian daily note.\n\n/task followed by the description will add it as a task item."
    );
  });

  bot.command("task", async (ctx) => {
    const task = `- [ ] ${ctx.match}`;
    await vaultWriter.insertMessageToVault(task, ctx.msg as MessageUpdate);
    try {
        await ctx.react("❤");
    } catch (err) {
        console.error("Failed to set reaction", err);
    }
  });
}

export function setupMessageHandlers(bot: Bot, settings: TGInboxSettings, vaultWriter: VaultWriter) {
  bot.on(["message:text", "channel_post:text"], async (ctx) => {
    const msg = ctx.msg as MessageUpdate;
    const content = generateContentFromTemplate(msg, settings)
    await vaultWriter.insertMessageToVault(content, msg)
      .then(async _ => {
        try {
          await ctx.react("❤");
        } catch (reactionErr) {
          console.error("Failed to set reaction");
        }
      })
      .catch((err: Error) => {
        console.error(`Failed to insert text message to vault. Error: ${err.message}`, err);
        ctx.reply(`Failed to insert text message to vault. Error: ${err.message}`);
      });
  });

  bot.on(["message:media", "channel_post:media"], async (ctx) => {
    const msg = ctx.msg as MessageUpdate;
    let content = generateContentFromTemplate(msg, settings);

    if (settings.download_media) {
      const file = await ctx.getFile();
      const filename_ext = generateFilename(msg, file);
      const url = getFileUrl(file, bot.token);

      console.debug(`Attempting to download media: ${filename_ext} from ${url}`);
      const downloadResult = await downloadAndSaveFile(url, filename_ext, settings.download_dir);

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

    await vaultWriter.insertMessageToVault(content, msg)
      .then(async _ => {
        try {
          await ctx.react("❤");
        } catch (reactionErr) {
          console.error("Failed to set reaction");
        }
      })
      .catch((err: Error) => {
        console.error(`Failed to insert media message to vault. Error: ${err.message}`, err);
        ctx.reply(`Failed to insert media message to vault. Error: ${err.message}`);
      });
  });
}
