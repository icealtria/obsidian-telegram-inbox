import { toMarkdownV2 } from "./markdown";
import { User } from "grammy/types";
import { MessageData, MessageUpdate, TGInboxSettings } from '../type';
import { moment } from "obsidian";
import * as Mustache from 'mustache';

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
        case "channel":
            {
                const chat = msg.forward_origin.chat;
                return {
                    origin_name: chat.title,
                    origin_username: chat.username || "",
                    origin_link: `https://t.me/${chat.username ? chat.username : chat.id}/${msg.forward_origin.message_id}`
                }
            }
        default:
            console.error("Unknown forward origin type:", type);
            return null;
    }
}

function getUserName(user: User) {
    return `${user.first_name}${user.last_name ? ' ' + user.last_name : ''}`;
}

function getSenderName(msg: MessageUpdate) {
    return `${msg.from.first_name}${msg.from?.last_name ? ' ' + msg.from.last_name : ''}`;
}
