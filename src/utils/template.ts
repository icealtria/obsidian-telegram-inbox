import { toMarkdownV2 } from "./markdown";
import type { User } from "grammy/types";
import type { MessageUpdate } from '../type';
import { moment } from "obsidian";
import * as Mustache from 'mustache';
import type { TGInboxSettings } from "src/settings";

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

interface PathData {
    date: string;
    first_name: string;
    name: string;
    time: string;
    user_id: number;
    origin_name: string;
}


export function generateContentFromTemplate(msg: MessageUpdate, setting: TGInboxSettings): string {
    const data = buildMsgData(msg, setting);
    return Mustache.render(setting.message_template, data);
}

export function buildMsgData(msg: MessageUpdate, setting: TGInboxSettings): MessageData {
    const forwardOrigin = getForwardOrigin(msg);

    const data: MessageData = {
        message_id: msg.message_id,
        text: toMarkdownV2(msg, setting),
        date: moment(msg.date * 1000).format("YYYY-MM-DD"),
        time: moment(msg.date * 1000).format("HH:mm"),
        name: getSenderName(msg),
        username: msg.from?.username,
        user_id: msg.from?.id || 0,
        ...forwardOrigin
    };

    return data;
}

export function generatePath(msg: MessageUpdate, setting: TGInboxSettings) {
    const data = rereplaceSpecialChar(buildPathData(msg));
    const path = Mustache.render(setting.custom_file_path, data);
    return path;
}

function rereplaceSpecialChar(data: PathData) {
    const regex = /[/\\[\]#^|:?*"<>]/g;

    data.first_name = data.first_name.replace(regex, "~");
    data.name = data.name.replace(regex, "~");
    data.origin_name = data.origin_name.replace(regex, "~");
    
    return data;
}

function buildPathData(msg: MessageUpdate) {
    const data: PathData = {
        date: moment(msg.date * 1000).format("YYYY-MM-DD"),
        first_name: msg.from.first_name,
        name: getSenderName(msg),
        time: moment(msg.date * 1000).format("HH-mm"),
        user_id: msg.from?.id || 0,
        origin_name: getForwardOrigin(msg)?.origin_name || getSenderName(msg),
    };
    return data;
}

function getForwardOrigin(msg: MessageUpdate) {
    if (!msg.forward_origin) {
        return null;
    }

    const { type } = msg.forward_origin;

    switch (type) {
        case "user":
            return {
                origin_name: getUserName(msg.forward_origin.sender_user),
                origin_username: msg.forward_origin.sender_user.username || "",
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
                origin_username: chat.username || "",
                origin_link: `https://t.me/${chat.username ? chat.username : chat.id}/${msg.forward_origin.message_id
                    }`,
            };
        }
        case "chat": {
            const chat = msg.forward_origin.sender_chat;
            if (chat.type === "private") {
                return {
                    origin_name: chat.first_name + chat.last_name ? ` ${chat.last_name}` : '',
                    origin_username: "",
                };
            } if (chat.type === "group") {
                return {
                    origin_name: chat.title,
                    origin_username: "",
                };
            }
            break;
        }
    }
}

function getUserName(user: User) {
    return `${user.first_name}${user.last_name ? ` ${user.last_name}` : ''}`;
}

function getSenderName(msg: MessageUpdate) {
    return `${msg.from.first_name}${msg.from?.last_name ? ` ${msg.from.last_name}` : ''}`;
}
