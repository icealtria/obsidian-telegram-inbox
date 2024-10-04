import { moment } from "obsidian";
import {
  createDailyNote,
  getAllDailyNotes,
  getDailyNote,
} from "obsidian-daily-notes-interface";


async function createDiary() {
  const date = moment();
  return await createDailyNote(date);
}

export async function getTodayDiary() {
  try {
    const date = moment();
    const dailyNotes = getAllDailyNotes();
    let dailyNote = getDailyNote(date, dailyNotes);

    if (!dailyNote) {
      console.log('Daily note not found, creating new one');
      dailyNote = await createDiary();
    }

    return dailyNote;
  } catch (error) {
    console.error(`Error retrieving or creating today's diary: ${error}`);
    throw error;
  }
}
