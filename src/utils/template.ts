import { toMarkdownV2 } from "./markdown";
import type { User } from "grammy/types";
import type { MessageUpdate } from "../type";
import { moment } from "obsidian";
import * as Mustache from "mustache";
import type { TGInboxSettings } from "src/settings/types";

const DATE_FORMAT = "YYYY-MM-DD";
const TIME_FORMAT = "HH:mm";
const PATH_TIME_FORMAT = "HH-mm";
const INVALID_FILENAME_CHARS = /[/\\[\]#^|:?*"<>]/g;
const REPLACEMENT_CHAR = "~";

export interface MessageData {
  message_id: number;
  origin_name?: string;
  origin_username?: string;
  text: string;
  date: string;
  time: string;
  name: string;
  username?: string;
  user_id: number;
  origin_link?: string;
}

export interface PathData {
  date: string;
  first_name: string;
  name: string;
  time: string;
  user_id: number;
  origin_name: string;
}

export function generateContentFromTemplate(
  msg: MessageUpdate,
  setting: TGInboxSettings
): string {
  const data = buildMsgData(msg, setting);
  return Mustache.render(setting.message_template, data);
}

export function buildMsgData(
  msg: MessageUpdate,
  setting: TGInboxSettings
): MessageData {
  const forwardOrigin = getForwardOrigin(msg);
  const msgDate = moment(msg.date * 1000);

  return {
    message_id: msg.message_id,
    text: toMarkdownV2(msg, setting),
    date: msgDate.format(DATE_FORMAT),
    time: msgDate.format(TIME_FORMAT),
    name: getSenderName(msg),
    username: msg.chat.username,
    user_id: msg.from?.id ?? msg.chat.id,
    ...forwardOrigin,
  };
}

export function generatePath(
  msg: MessageUpdate,
  setting: TGInboxSettings
): string {
  const data = sanitizePathData(buildPathData(msg));
  return Mustache.render(setting.custom_file_path, data);
}

function sanitizePathData(data: PathData): PathData {
  return {
    ...data,
    first_name: data.first_name.replace(INVALID_FILENAME_CHARS, REPLACEMENT_CHAR),
    name: data.name.replace(INVALID_FILENAME_CHARS, REPLACEMENT_CHAR),
    origin_name: data.origin_name.replace(INVALID_FILENAME_CHARS, REPLACEMENT_CHAR),
  };
}

export function buildPathData(msg: MessageUpdate): PathData {
  const msgDate = moment(msg.date * 1000);
  const forwardOrigin = getForwardOrigin(msg);

  return {
    date: msgDate.format(DATE_FORMAT),
    first_name: msg.from?.first_name ?? msg.chat.title!,
    name: getSenderName(msg),
    time: msgDate.format(PATH_TIME_FORMAT),
    user_id: msg.from?.id ?? msg.chat.id,
    origin_name: forwardOrigin?.origin_name ?? getSenderName(msg),
  };
}

interface ForwardOriginInfo {
  origin_name: string;
  origin_username?: string;
  origin_link?: string;
}

function getForwardOrigin(msg: MessageUpdate): ForwardOriginInfo | null {
  if (!msg.forward_origin) {
    return null;
  }

  const { type } = msg.forward_origin;

  switch (type) {
    case "user":
      return {
        origin_name: getUserName(msg.forward_origin.sender_user),
        origin_username: msg.forward_origin.sender_user.username ?? "",
      };

    case "hidden_user":
      return {
        origin_name: msg.forward_origin.sender_user_name,
        origin_username: "",
      };

    case "channel": {
      const chat = msg.forward_origin.chat;
      return {
        origin_name: chat.title,
        origin_username: chat.username ?? "",
        origin_link: chat.username
          ? `https://t.me/${chat.username}/${msg.forward_origin.message_id}`
          : `https://t.me/c/${String(chat.id).replace("-100", "")}/${msg.forward_origin.message_id}`,
      };
    }

    case "chat": {
      const chat = msg.forward_origin.sender_chat;
      if (chat.type === "private") {
        return {
          origin_name: formatPrivateChatName(chat),
          origin_username: "",
        };
      }
      if (chat.type === "group" || chat.type === "supergroup") {
        return {
          origin_name: chat.title,
          origin_username: "",
        };
      }
      return null;
    }

    default:
      return null;
  }
}

function formatPrivateChatName(chat: {
  first_name?: string;
  last_name?: string;
}): string {
  const firstName = chat.first_name ?? "";
  const lastName = chat.last_name ? ` ${chat.last_name}` : "";
  return `${firstName}${lastName}`.trim() || "Unknown";
}

function getUserName(user: User): string {
  const lastName = user.last_name ? ` ${user.last_name}` : "";
  return `${user.first_name}${lastName}`;
}

function getSenderName(msg: MessageUpdate): string {
  if (msg.from) {
    return getUserName(msg.from);
  }
  return msg.chat.title ?? "Unknown";
}
