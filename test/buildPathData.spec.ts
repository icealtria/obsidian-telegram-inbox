import { type PathData, buildPathData } from "../src/utils/template";
import { msg, msgFowardUser, channel_post, channel_post_fw } from "./msgs";

describe('generatePath', () => {
    test('normal message', () => {
        const data: PathData = {
            date: "2021-07-21",
            first_name: "Neko",
            name: "Neko ✨",
            time: "14-00",
            user_id: 12345,
            origin_name: "Neko ✨"
        }

        expect(buildPathData(msg)).toStrictEqual(data)
    })

    test('forward message', () => {

        const data: PathData = {
            date: "2021-07-21",
            first_name: "Neko",
            name: "Neko ✨",
            time: "14-00",
            user_id: 12345,
            origin_name: "猫"
        }

        expect(buildPathData(msgFowardUser)).toStrictEqual(data)
    })

    test('channel post', () => {
        const data: PathData = {
            date: "2025-01-10",
            first_name: "📒",
            name: "📒",
            time: "13-03",
            user_id: -1001234567890,
            origin_name: "📒"
        }
        expect(buildPathData(channel_post)).toStrictEqual(data)
    })

    test('channel post forward', () => {
        const data: PathData = {
            date: "2025-01-10",
            first_name: "📒",
            name: "📒",
            time: "00-40",
            user_id: -1001234567890,
            origin_name: "Haha"
        }
        expect(buildPathData(channel_post_fw)).toStrictEqual(data)
    })
})