import { render } from "micromustache";
import { toMarkdownV2 } from "./markdown";
import { Message, User } from "grammy/types";

export function generateContentFromTemplate(msg: Message, template: string): string {
    const data = buildMsgData(msg);
    return render(template, data);
}

export function buildMsgData(msg: Message) {
    const forwardOrigin = getForwardOrigin(msg);

    const data: Data = {
        text: toMarkdownV2(msg),
        date: msg.date,
        name: getSenderName(msg),
        username: msg.from?.username || "",
        user_id: msg.from?.id || 0,
        ...forwardOrigin
    };

    return data;
}

function getForwardOrigin(msg: Message) {
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
                from_name: msg.forward_origin.sender_user_name,
                from_username: "",
            };
        case "channel":
            return {
                from_name: msg.forward_origin.chat.title,
                from_username: msg.forward_origin.chat.username || "",
            };
        default:
            console.error("Unknown forward origin type:", type);
            return null;
    }
}

function getUserName(user: User) {
    return `${user.first_name}${user.last_name ? ' ' + user.last_name : ''}`;
}

function getSenderName(msg: Message) {
    return `${msg.from?.first_name}${msg.from?.last_name ? ' ' + msg.from.last_name : ''}`;
}

interface Data {
    forward_name?: string;
    forward_username?: string;
    text: string;
    date: number;
    name: string;
    username: string;
    user_id: number;
}