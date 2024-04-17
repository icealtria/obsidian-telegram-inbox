import { toMarkdownV2 } from "./markdown";
import { User } from "grammy/types";
import { MessageData, MessageUpdate } from '../type';
import { moment } from "obsidian";
import * as Mustache from 'mustache';

export function generateContentFromTemplate(msg: MessageUpdate, template: string): string {
    const data = buildMsgData(msg);
    return Mustache.render(template, data);
}

export function buildMsgData(msg: MessageUpdate) {
    const forwardOrigin = getForwardOrigin(msg);

    const data: MessageData = {
        origin_link: getOriginLink(msg),
        message_id: msg.message_id,
        text: toMarkdownV2(msg),
        date: moment(msg.date * 1000).format("YYYY-MM-DD"),
        time: moment(msg.date * 1000).format("HH:mm"),
        name: getSenderName(msg),
        username: msg.from?.username || "",
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
                forward_name: getUserName(msg.forward_origin.sender_user),
                forward_username: msg.forward_origin.sender_user.username || "",
            };
        case "hidden_user":
            return {
                forward_name: msg.forward_origin.sender_user_name,
                forward_username: "",
            };
        case "channel":
            return {
                forward_name: msg.forward_origin.chat.title,
                forward_username: msg.forward_origin.chat.username || "",
            };
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

function getOriginLink(msg: MessageUpdate) {
    if (msg.forward_origin?.type === "channel") {
        const chat = msg.forward_origin.chat;
        return `https://t.me/${chat.username ? chat.username : chat.id}/${msg.forward_origin.message_id}`;
    }
}
