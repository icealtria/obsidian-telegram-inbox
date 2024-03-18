import { moment } from "obsidian";
import {
  createDailyNote,
  getAllDailyNotes,
  getDailyNote,
} from "obsidian-daily-notes-interface";
// @ts-ignore
import https from "https";
import { File } from "grammy/types";

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
  return new Promise((resolve, reject) => {
    https
      // @ts-ignore
      .get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(
            new Error(
              `Failed to download ${url}: ${response.statusCode} ${response.statusMessage}`
            )
          );
          return;
        }

        const chunks: Uint8Array[] = [];
        response.on("data", (chunk: Uint8Array) => {
          chunks.push(chunk);
        });

        response.on("end", () => {
          const buffer = Buffer.concat(chunks);
          resolve(buffer.buffer);
        });

        response.on("error", reject);
      })
      .on("error", reject);
  });
}

export function getExt(path: string) {
  return path.split(".").pop();
}

export function getFileUrl(file: File, token: string) {
  const TG_API = "https://api.telegram.org/file/bot";
  return `${TG_API}${token}/${file.file_path}`;
}
