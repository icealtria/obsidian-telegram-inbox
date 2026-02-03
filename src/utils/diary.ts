import { moment } from "obsidian";
import {
  createDailyNote,
  getAllDailyNotes,
  getDailyNote,
} from "obsidian-daily-notes-interface";
import type { TGInboxSettings } from "../settings/types";

const DEFAULT_CUTOFF = "00:00";

export async function getDiaryWithTimeCutoff(
  settings: TGInboxSettings,
  messageDate?: moment.Moment
) {
  const date = messageDate || moment();
  const adjustedDate = getAdjustedDateForTimeCutoff(
    date,
    settings.daily_note_time_cutoff || DEFAULT_CUTOFF
  );

  const dailyNotes = getAllDailyNotes();
  const dailyNote = getDailyNote(adjustedDate, dailyNotes);

  if (dailyNote) {
    return dailyNote;
  }

  console.log("Daily note not found, creating new one");
  return await createDailyNote(adjustedDate);
}

export function getAdjustedDateForTimeCutoff(
  messageDate: moment.Moment,
  timeCutoff: string
): moment.Moment {
  const [cutoffHour, cutoffMinute] = timeCutoff.split(":").map(Number);
  const messageHour = messageDate.hour();
  const messageMinute = messageDate.minute();

  const isBeforeCutoff =
    messageHour < cutoffHour ||
    (messageHour === cutoffHour && messageMinute < cutoffMinute);

  if (isBeforeCutoff) {
    return moment(messageDate).subtract(1, "day");
  }

  return moment(messageDate);
}
