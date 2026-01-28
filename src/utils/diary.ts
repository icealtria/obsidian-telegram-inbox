import { moment } from "obsidian";
import {
  createDailyNote,
  getAllDailyNotes,
  getDailyNote,
} from "obsidian-daily-notes-interface";
import type { TGInboxSettings } from "../settings/types";

async function createDiary(date: moment.Moment) {
  return await createDailyNote(date);
}

export async function getDiaryWithTimeCutoff(settings: TGInboxSettings, messageDate?: moment.Moment) {
  try {
    const date = messageDate || moment();
    const adjustedDate = getAdjustedDateForTimeCutoff(date, settings.daily_note_time_cutoff);

    const dailyNotes = getAllDailyNotes();
    let dailyNote = getDailyNote(adjustedDate, dailyNotes);

    if (!dailyNote) {
      console.log('Daily note not found, creating new one');
      dailyNote = await createDiary(adjustedDate);
    }

    return dailyNote;
  } catch (error) {
    console.error(`Error retrieving or creating diary with time cutoff: ${error}`);
    throw error;
  }
}

export function getAdjustedDateForTimeCutoff(messageDate: moment.Moment, timeCutoff: string): moment.Moment {
  // Parse the time cutoff (format: "HH:MM")
  const [cutoffHour, cutoffMinute] = timeCutoff.split(':').map(Number);

  // Get the message time (only time part)
  const messageHour = messageDate.hour();
  const messageMinute = messageDate.minute();

  // If message time is before the cutoff time, use previous day
  if (messageHour < cutoffHour || (messageHour === cutoffHour && messageMinute < cutoffMinute)) {
    return moment(messageDate).subtract(1, 'day');
  }

  // Otherwise, use the same day
  return moment(messageDate);
}
