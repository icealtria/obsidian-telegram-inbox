import { moment } from "obsidian";
import {
  createDailyNote,
  getAllDailyNotes,
  getDailyNote,
} from "obsidian-daily-notes-interface";
import type { TGInboxSettings } from "../settings/types";

const DEFAULT_CUTOFF = "00:00";

/**
 * Resolves the daily note file after applying timezone + cutoff rules.
 * Creates the target daily note when it does not exist.
 */
export async function getDiaryWithTimeCutoff(
  settings: TGInboxSettings,
  messageDate?: moment.Moment
) {
  const date = messageDate || moment();
  const zonedDate = applyTimezone(date, settings.daily_note_timezone);
  const adjustedDate = getAdjustedDateForTimeCutoff(
    zonedDate,
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

/**
 * Shifts messages before cutoff to the previous day.
 * Example: cutoff "04:00" means 03:59 belongs to yesterday.
 */
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

/**
 * Applies an IANA timezone by reconstructing a local moment from formatted parts.
 * If timezone is blank or invalid, system timezone is used.
 */
function applyTimezone(date: moment.Moment, timezone: string): moment.Moment {
  const normalizedTimezone = timezone.trim();
  if (!normalizedTimezone) {
    return moment(date);
  }

  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: normalizedTimezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    });

    const parts = formatter.formatToParts(date.toDate());
    const year = getPart(parts, "year");
    const month = getPart(parts, "month");
    const day = getPart(parts, "day");
    const hour = getPart(parts, "hour");
    const minute = getPart(parts, "minute");
    const second = getPart(parts, "second");

    return moment(`${year}-${month}-${day}T${hour}:${minute}:${second}`);
  } catch (error) {
    console.warn(`Invalid timezone '${normalizedTimezone}', using system timezone.`, error);
    return moment(date);
  }
}

/** Reads a specific part from Intl formatted output with zero fallback. */
function getPart(
  parts: Intl.DateTimeFormatPart[],
  type: Intl.DateTimeFormatPartTypes
): string {
  return parts.find((part) => part.type === type)?.value ?? "00";
}
