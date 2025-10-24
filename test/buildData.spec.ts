import { type MessageData, buildMsgData } from "../src/utils/template";
import { describe, expect, test } from "@jest/globals"
import { msg, msgHidden, msgFowardUser, msgCh, channel_post_fw, channel_post } from "./msgs";
import type { TGInboxSettings } from "src/settings";

jest.mock("obsidian");

const settings: TGInboxSettings = {
    token: "",
    marker: "",
    allow_users: [],
    download_dir: "",
    download_media: false,
    message_template: "",
    markdown_escaper: false,
    is_custom_file: false,
    custom_file_path: "",
    disable_auto_reception: true,
    reverse_order: false,
    remove_formatting: false,
    daily_note_time_cutoff: "00:00",
    run_after_sync: false,
}


describe('buildData', () => {

    test('forward message', () => {

        const data: MessageData = {
            origin_name: "猫",
            origin_username: "cat",
            message_id: 1234,
            name: "Neko ✨",
            text: "喵呜呜～",
            user_id: 12345,
            date: "2021-07-21",
            time: "14:00",
            username: "neko"
        }

        expect(buildMsgData(msgFowardUser, settings)).toStrictEqual(data)
    })


    test('hidden user', () => {

        const data: MessageData = {
            origin_name: "Black Cat",
            origin_username: "",
            text: "I am a black cat.",
            date: "2021-07-21",
            time: "14:00",
            name: "Neko ✨",
            username: "neko",
            user_id: 12345,
            message_id: 1234,
        }

        expect(buildMsgData(msgHidden, settings)).toStrictEqual(data)
    })

    test('without forward_origin', () => {

        const data: MessageData = {
            text: "I am a cat.",
            date: "2021-07-21",
            time: "14:00",
            name: "Neko ✨",
            username: "neko",
            user_id: 12345,
            message_id: 1234,
        }
        expect(buildMsgData(msg, settings)).toStrictEqual(data)
    });

    test("Ch", () => {
        const data: MessageData = {
            origin_name: "Many cats every day",
            origin_username: "miaowu",
            message_id: 1234,
            text: "Cats rule the earth.",
            date: "2021-07-21",
            time: "14:00",
            name: "Neko ✨",
            username: "neko",
            user_id: 12345,
            origin_link: "https://t.me/miaowu/42065"
        }

        expect(buildMsgData(msgCh, settings)).toStrictEqual(
            data
        )
    })

    test("channel post", () => {
        const data: MessageData = {
            message_id: 263,
            text: "test",
            date: "2025-01-10",
            time: "13:03",
            name: "📒",
            username: "rin",
            user_id: -1001234567890,
        }

        expect(buildMsgData(channel_post, settings)).toStrictEqual(data)
    })

    test("channel post forward", () => {

        const data: MessageData = {
            origin_name: "Haha",
            origin_username: "haha",
            message_id: 259,
            text: "喵呜呜",
            date: "2025-01-10",
            time: "00:40",
            name: "📒",
            username: "rin",
            user_id: -1001234567890,
            origin_link: "https://t.me/haha/2174789"
        }
        expect(buildMsgData(channel_post_fw, settings)).toStrictEqual(data)

    })
});
