import { moment } from "obsidian";
import {
  createDailyNote,
  getAllDailyNotes,
  getDailyNote,
} from "obsidian-daily-notes-interface";


async function createDiary() {
  const date = moment();
  return createDailyNote(date);
}

export async function getTodayDiary() {
  const date = moment();
  const dailyNotes = getAllDailyNotes();
  let dailyNote = getDailyNote(date, dailyNotes);
  if (!dailyNote) {
    console.debug('Daily note not found, creating new one');
    dailyNote = await createDiary();
  }
  return dailyNote;
}
