import { MessageUpdate, MsgChannel, MsgNonChannel } from "../src/type";

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

export const channel_post_fw: MsgChannel = {
    "message_id": 259,
    "sender_chat": {
        "id": -1001234567890,
        "title": "📒",
        "type": "channel",
        "username": "rin"
    },
    "chat": {
        "id": -1001234567890,
        "title": "📒",
        "type": "channel",
        "username": "rin"
    },
    "date": 1736440840,
    "forward_origin": {
        "type": "channel",
        "chat": {
            "id": -100133210000,
            "title": "Haha",
            "username": "haha",
            "type": "channel"
        },
        "message_id": 2174789,
        "date": 1736440781
    },
    "text": "喵呜呜",
}

export const channel_post: MsgChannel = {

    "message_id": 263,
    "sender_chat": {
        "id": -1001234567890,
        "title": "📒",
        "username": "rin",
        "type": "channel"
    },
    "chat": {
        "id": -1001234567890,
        "title": "📒",
        "username": "rin",
        "type": "channel"
    },
    "date": 1736485426,
    "text": "test"
}

