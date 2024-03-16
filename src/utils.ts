import { moment } from "obsidian";
import {
  createDailyNote,
  getAllDailyNotes,
  getDailyNote,
} from "obsidian-daily-notes-interface";

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
