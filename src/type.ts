import type { Message, Update } from "grammy/types";

export type MessageUpdate = MsgChannel | MsgNonChannel

export type MsgChannel = Message & Update.Channel

export type MsgNonChannel = Message & Update.NonChannel