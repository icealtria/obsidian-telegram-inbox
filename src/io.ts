import { getTodayDiary } from "./utils/diary";
import type { Vault } from "obsidian";

import { Mutex } from "async-mutex";

const mutex = new Mutex();
export async function insertAfterMarker(
  vault: Vault,
  message: string,
  marker: string
) {
  const todayDiary = await getTodayDiary();
  let fileContent = await vault.read(todayDiary);
  const lines = fileContent.split("\n");
  let inboxIndex = lines.findIndex((line) => line.trim() === marker);
  if (inboxIndex === -1) {
    inboxIndex = lines.length;
    lines.push(marker);
  }
  lines.splice(inboxIndex + 1, 0, message);
  fileContent = lines.join("\n");
  vault.modify(todayDiary, fileContent);
}

export async function insertMessage(vault: Vault, message: string) {
  const release = await mutex.acquire();
  try {
    const todayDiary = await getTodayDiary();
    const fileContent = await vault.read(todayDiary);
    if (fileContent.trim() === "") {
      vault.modify(todayDiary, message);
    } else {
      const updatedContent = fileContent.endsWith("\n")
        ? `${fileContent}${message}`
        : `${fileContent}\n${message}`;
      vault.modify(todayDiary, updatedContent);
    }
  } catch (error) {
    console.error("Error inserting message:", error);
  } finally {
    release();
  }
}
