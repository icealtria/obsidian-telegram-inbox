import { buildMsgData } from "../src/utils/template";
import { describe, expect, test } from "@jest/globals"
import { msg, msgHidden, msgFowardUser, msgCh } from "./msgs";
import { MessageData } from "src/type";

describe('buildData', () => {

    test('forward message', () => {

        const data: MessageData = {
            forward_name: "猫",
            forward_username: "cat",
            message_id: 1234,
            name: "Neko ✨",
            text: "喵呜呜～",
            user_id: 12345,
            date: "2021-07-21",
            time: "14:00",
            username: "neko"
        }

        expect(buildMsgData(msgFowardUser)).toStrictEqual(data)
    })


    test('hidden user', () => {

        const data: MessageData = {
            forward_name: "Black Cat",
            forward_username: "",
            text: "I am a black cat.",
            date: "2021-07-21",
            time: "14:00",
            name: "Neko ✨",
            username: "neko",
            user_id: 12345,
            message_id: 1234,
        }

        expect(buildMsgData(msgHidden)).toStrictEqual(data)
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
        expect(buildMsgData(msg)).toStrictEqual(data)
    });

    test("Ch", () => {
        const data: MessageData = {
            forward_name: "Many cats every day",
            forward_username: "miaowu",
            message_id: 1234,
            text: "Cats rule the earth.",
            date: "2021-07-21",
            time: "14:00",
            name: "Neko ✨",
            username: "neko",
            user_id: 12345
        }

        expect(buildMsgData(msgCh)).toStrictEqual(
            data
        )
    })
});
