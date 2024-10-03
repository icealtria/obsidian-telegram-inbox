import { getTodayDiary } from "./utils/diary";
import type { TFile, Vault } from "obsidian";

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

export async function insertMessage(vault: Vault, message: string, tFile: TFile) {
  try {
    await vault.process(tFile, (data) => {
      const updatedContent = data.trim() === ""
        ? message
        : data.endsWith("\n")
          ? `${data}${message}`
          : `${data}\n${message}`;
      return updatedContent;
    });
  } catch (error) {
    throw new Error(`Error inserting message. ${error}`);
  }
}

export async function insertMessageAtTop(vault: Vault, message: string, tFile: TFile) {
  try {
    await vault.process(tFile, (data) => {
      const updatedContent = `${message}\n${data}`;
      return updatedContent;
    });
  } catch (error) {
    throw new Error(`Error inserting message. ${error}`);
  }
}
