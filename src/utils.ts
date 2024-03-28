import { moment } from "obsidian";
import {
  createDailyNote,
  getAllDailyNotes,
  getDailyNote,
} from "obsidian-daily-notes-interface";
import { File } from "grammy/types";
import { requestUrl } from "obsidian";
import { escapers, serialiseWith } from "@telegraf/entity";
import { markdownSerialiser } from "./serialier";

export async function createDiary() {
  const date = moment();
  return createDailyNote(date);
}

export async function getTodayDiary() {
  const date = moment();
  const dailyNotes = getAllDailyNotes();
  let dailyNote = getDailyNote(date, dailyNotes);
  if (!dailyNote) {
    dailyNote = await createDiary();
  }
  return dailyNote;
}

export function toBullet(content: string) {
  return content
    .split("\n")
    .map((line, index) => {
      if (index === 0) {
        return `- ${line}`;
      } else {
        return `  ${line}`;
      }
    })
    .join("\n");
}

export function downloadAsArrayBuffer(url: string): Promise<ArrayBuffer> {
  return requestUrl(url).arrayBuffer;
}

export function getExt(path: string) {
  return path.split(".").pop();
}

export function getFileUrl(file: File, token: string) {
  const TG_API = "https://api.telegram.org/file/bot";
  return `${TG_API}${token}/${file.file_path}`;
}

export const toMarkdownV2 = serialiseWith(markdownSerialiser, escapers.HTML)
