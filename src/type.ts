import type { Message, Update } from "grammy/types";

export type MessageUpdate = (Message & Update.NonChannel & Record<"text" | "from", string | number | boolean | object> & Partial<Record<never, undefined>>) | (Message & Update.NonChannel & Record<"photo" | "from", string | number | boolean | object> & Partial<Record<"video", undefined>>) | (Message & Update.NonChannel & Record<"video" | "from", string | number | boolean | object> & Partial<Record<"photo", undefined>>)
