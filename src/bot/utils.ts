import { moment } from "obsidian";
import type { Message, File } from "grammy/types";
import { getExt } from "../utils/file";

export function generateFilename(msg: Message, file: File): string {
  const message_id = msg.message_id;
  const dateStr = moment(msg.date * 1000).format("YYYYMMDD");
  const extension = getExt(file.file_path || "");
  return `${dateStr}-${message_id}.${extension}`;
}
