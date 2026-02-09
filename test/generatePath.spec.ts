import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { TGInboxSettings } from "src/settings/types";
import { generatePath } from "../src/utils/template";
import { msgFowardUser, channel_post_fw, channel_post } from "./msgs";

const settings: TGInboxSettings = {
    token: "",
    marker: "",
    allow_users: [],
    download_dir: "",
    download_media: false,
    message_template: "",
    markdown_escaper: false,
    is_custom_file: false,
    custom_file_path: "/Telegram/{{name}}-{{origin_name}}-{{user_id}}/{{date}}-{{time}}",
    disable_auto_reception: true,
    reverse_order: false,
    remove_formatting: false,
    daily_note_time_cutoff: "00:00",
    run_after_sync: false
}

describe('generatePath', () => {

    test('forward message', () => {
        const path = "/Telegram/Neko ✨-猫-12345/2021-07-21-14-00"

        assert.strictEqual(generatePath(msgFowardUser, settings), path)
    })

    test('channel_post', () => {
        const path = "/Telegram/📒-📒--1001234567890/2025-01-10-13-03"

        assert.strictEqual(generatePath(channel_post, settings), path)
    })

    test('channel_post_fw', () => {
        const path = "/Telegram/📒-Haha--1001234567890/2025-01-10-00-40"

        assert.strictEqual(generatePath(channel_post_fw, settings), path)

    })
})
