import { MsgChannel, MsgNonChannel } from "../src/type";

type MessageUpdate = MsgChannel | MsgNonChannel;

export const msgHidden: MessageUpdate = {
    "message_id": 1234,
    "from": {
        "id": 12345,
        "is_bot": false,
        "first_name": "Neko",
        "last_name": "✨",
        "username": "neko",
        "language_code": "en"
    },
    "chat": {
        "id": 12345,
        "first_name": "Neko",
        "last_name": "✨",
        "username": "neko",
        "type": "private"
    },
    "date": 1626847200,
    "forward_origin": {
        "type": "hidden_user",
        "sender_user_name": "Black Cat",
        "date": 1626847200
    },
    "text": "I am a black cat."
}

export const msg: MessageUpdate = {
    "message_id": 1234,
    "from": {
        "id": 12345,
        "is_bot": false,
        "first_name": "Neko",
        "last_name": "✨",
        "username": "neko",
        "language_code": "en"
    },
    "chat": {
        "id": 12345,
        "first_name": "Neko",
        "last_name": "✨",
        "username": "neko",
        "type": "private"
    },
    "date": 1626847200,
    "text": "I am a cat."
}

export const msgCh: MessageUpdate = {
    "message_id": 1234,
    "from": {
        "id": 12345,
        "is_bot": false,
        "first_name": "Neko",
        "last_name": "✨",
        "username": "neko",
        "language_code": "en"
    },
    "chat": {
        "id": 12345,
        "first_name": "Neko",
        "last_name": "✨",
        "username": "neko",
        "type": "private"
    },
    "date": 1626847200,
    "forward_origin": {
        "type": "channel",
        "chat": {
            "id": -1001021086777,
            "title": "Many cats every day",
            "username": "miaowu",
            "type": "channel"
        },
        "message_id": 42065,
        "date": 1626847200
    },
    "text": "Cats rule the earth."
}

export const msgFowardUser: MessageUpdate = {
    "message_id": 1234,
    "from": {
        "id": 12345,
        "is_bot": false,
        "first_name": "Neko",
        "last_name": "✨",
        "username": "neko",
        "language_code": "en"
    },
    "chat": {
        "id": 12345,
        "first_name": "Neko",
        "last_name": "✨",
        "username": "neko",
        "type": "private"
    },
    "date": 1626847200,
    "forward_origin": {
        "type": "user",
        "sender_user": {
            "id": 414141414,
            "is_bot": false,
            "first_name": "猫",
            "username": "cat",
            "language_code": "zh-hans"
        },
        "date": 1626847200
    },
    "text": "喵呜呜～"
}