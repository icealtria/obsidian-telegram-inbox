import { Message, Update } from "grammy/types";

export type MessageText = Message & Update.NonChannel & Record<"text" | "from", string | number | boolean | object> & Partial<Record<never, undefined>>