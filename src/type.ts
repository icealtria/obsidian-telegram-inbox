export interface TGInboxSettings {
  token: string;
  marker: string;
  allow_users: string[];
  bullet: boolean;
  download_dir: string;
  download_media: boolean;
  message_template: string;
}

import { Message, Update } from "grammy/types";

export type MessageUpdate = (Message & Update.NonChannel & Record<"text" | "from", string | number | boolean | object> & Partial<Record<never, undefined>>) | (Message & Update.NonChannel & Record<"photo" | "from", string | number | boolean | object> & Partial<Record<"video", undefined>>) | (Message & Update.NonChannel & Record<"video" | "from", string | number | boolean | object> & Partial<Record<"photo", undefined>>)

export interface MessageData {
  message_id: number;
  origin_name?: string;
  origin_username?: string;
  text: string;
  date: string;
  time: string;
  name: string;
  username: string;
  user_id: number;
  origin_link?: string;
}
