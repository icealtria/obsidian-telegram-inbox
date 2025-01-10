import type { Message, Update } from "grammy/types";

export type MessageUpdate = {
    type: 'channel';
    message: MsgChannel;
} | {
    type: 'private';
    message: MsgNonChannel;
}
export type MsgChannel = Message & Update.Channel

export type MsgNonChannel = Message & Update.NonChannel