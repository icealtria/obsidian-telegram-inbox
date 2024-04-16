import { buildMsgData } from "../src/utils/template";
import { describe, expect, test } from "@jest/globals"
import { MessageText } from "./type";


describe('buildData', () => {
    const baseMsg = {
        from: {
            is_bot: false,
            first_name: 'John',
            last_name: 'Doe',
            username: 'johndoe',
            id: 12345,
        },
        text: 'HAHAHA',
        date: 1626847200,
        message_id: 1234,
    }

    test('should build data object with MessageOriginUser', () => {
        const msg: MessageText = {
            forward_origin: {
                type: 'user',
                date: 1626847200,
                sender_user: {
                    first_name: 'Jane',
                    last_name: 'Smith',
                    username: 'janesmith',
                    id: 54321,
                    is_bot: false
                }
            },
            chat: {
                id: 5678,
                type: 'private',
                first_name: 'John',
                last_name: 'Doe'
            },
            ...baseMsg,
        };

        expect(buildMsgData(msg)).toStrictEqual({
            forward_name: "Jane Smith",
            forward_username: "janesmith",
            text: "HAHAHA",
            date: 1626847200,
            name: "John Doe",
            username: "johndoe",
            user_id: 12345,
        })
    })

    test('should build data object without forward_origin', () => {
        const msg: MessageText = {
            chat: {
                id: 5678,
                type: 'private',
                first_name: 'John',
                last_name: 'Doe'
            },
            ...baseMsg
        };

        const data = buildMsgData(msg);

        expect(data).toStrictEqual({
            name: 'John Doe',
            username: 'johndoe',
            user_id: 12345,
            date: 1626847200,
            text: 'HAHAHA',
        })
    });
});

