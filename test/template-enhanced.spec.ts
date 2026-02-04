import { describe, expect, test } from "@jest/globals";
import {
  generateContentFromTemplate,
  buildMsgData,
  generatePath,
  buildPathData,
} from "../src/utils/template";
import type { TGInboxSettings } from "../src/settings/types";
import type { MessageUpdate } from "../src/type";

jest.mock("obsidian");

const baseSettings: TGInboxSettings = {
  token: "",
  marker: "",
  allow_users: [],
  download_dir: "",
  download_media: false,
  message_template: "{{text}} - {{name}} - {{date}}",
  markdown_escaper: false,
  is_custom_file: false,
  custom_file_path: "Telegram/{{name}}/{{date}}-{{time}}",
  disable_auto_reception: true,
  reverse_order: false,
  remove_formatting: false,
  daily_note_time_cutoff: "00:00",
  run_after_sync: false,
};

function createMockMessage(
  text: string,
  overrides?: Partial<MessageUpdate>
): MessageUpdate {
  return {
    message_id: 1,
    from: {
      id: 123,
      is_bot: false,
      first_name: "Test",
      last_name: "User",
      username: "testuser",
    },
    chat: {
      id: 123,
      first_name: "Test",
      last_name: "User",
      username: "testuser",
      type: "private",
    },
    date: 1626847200, // 2021-07-21 14:00:00
    text,
    ...overrides,
  } as MessageUpdate;
}

describe("generateContentFromTemplate", () => {
  test("renders template with message data", () => {
    const msg = createMockMessage("Hello world");
    const result = generateContentFromTemplate(msg, baseSettings);
    expect(result).toBe("Hello world - Test User - 2021-07-21");
  });

  test("renders template with custom template", () => {
    const settings = {
      ...baseSettings,
      message_template: "From {{username}}: {{text}}",
    };
    const msg = createMockMessage("Test message");
    const result = generateContentFromTemplate(msg, settings);
    expect(result).toBe("From testuser: Test message");
  });

  test("handles template with all available fields", () => {
    const settings = {
      ...baseSettings,
      message_template:
        "{{text}} | {{name}} | {{username}} | {{user_id}} | {{date}} | {{time}} | {{message_id}}",
    };
    const msg = createMockMessage("Test");
    const result = generateContentFromTemplate(msg, settings);
    expect(result).toBe(
      "Test | Test User | testuser | 123 | 2021-07-21 | 14:00 | 1"
    );
  });

  test("handles template with forward origin fields", () => {
    const settings = {
      ...baseSettings,
      message_template: "From {{origin_name}}: {{text}}",
    };
    const msg = createMockMessage("Forwarded message", {
      forward_origin: {
        type: "user",
        sender_user: {
          id: 456,
          is_bot: false,
          first_name: "Original",
          last_name: "Sender",
          username: "originaluser",
        },
        date: 1626847200,
      },
    });
    const result = generateContentFromTemplate(msg, settings);
    expect(result).toBe("From Original Sender: Forwarded message");
  });

  test("handles empty template", () => {
    const settings = { ...baseSettings, message_template: "" };
    const msg = createMockMessage("Test");
    const result = generateContentFromTemplate(msg, settings);
    expect(result).toBe("");
  });

  test("handles template with only static text", () => {
    const settings = { ...baseSettings, message_template: "Static text only" };
    const msg = createMockMessage("Test");
    const result = generateContentFromTemplate(msg, settings);
    expect(result).toBe("Static text only");
  });

  test("handles template with unknown variables", () => {
    const settings = {
      ...baseSettings,
      message_template: "{{unknown_var}} {{text}}",
    };
    const msg = createMockMessage("Test");
    const result = generateContentFromTemplate(msg, settings);
    expect(result).toBe(" Test");
  });
});

describe("generatePath", () => {
  test("generates path from template", () => {
    const msg = createMockMessage("Test");
    const result = generatePath(msg, baseSettings);
    expect(result).toBe("Telegram/Test User/2021-07-21-14-00");
  });

  test("generates path with custom template", () => {
    const settings = {
      ...baseSettings,
      custom_file_path: "Notes/{{first_name}}/{{date}}",
    };
    const msg = createMockMessage("Test");
    const result = generatePath(msg, settings);
    expect(result).toBe("Notes/Test/2021-07-21");
  });

  test("sanitizes invalid filename characters", () => {
    const msg = createMockMessage("Test", {
      from: {
        id: 123,
        is_bot: false,
        first_name: "Test/User#1",
        last_name: "Name",
        username: "testuser",
      },
    });
    const result = generatePath(msg, baseSettings);
    expect(result).toBe("Telegram/Test~User~1 Name/2021-07-21-14-00");
  });

  test("handles channel post", () => {
    const msg = {
      message_id: 1,
      sender_chat: {
        id: -1001234567890,
        title: "📒 Channel",
        type: "channel",
        username: "channeluser",
      },
      chat: {
        id: -1001234567890,
        title: "📒 Channel",
        type: "channel",
        username: "channeluser",
      },
      date: 1626847200,
      text: "Channel message",
    } as MessageUpdate;
    const result = generatePath(msg, baseSettings);
    expect(result).toBe("Telegram/📒 Channel/2021-07-21-14-00");
  });

  test("handles forward origin in path", () => {
    const settings = {
      ...baseSettings,
      custom_file_path: "{{origin_name}}/{{date}}",
    };
    const msg = createMockMessage("Test", {
      forward_origin: {
        type: "user",
        sender_user: {
          id: 456,
          is_bot: false,
          first_name: "Original",
          last_name: "Sender",
          username: "originaluser",
        },
        date: 1626847200,
      },
    });
    const result = generatePath(msg, settings);
    expect(result).toBe("Original Sender/2021-07-21");
  });
});

describe("buildPathData", () => {
  test("builds path data for normal message", () => {
    const msg = createMockMessage("Test");
    const result = buildPathData(msg);
    expect(result).toEqual({
      date: "2021-07-21",
      first_name: "Test",
      name: "Test User",
      time: "14-00",
      user_id: 123,
      origin_name: "Test User",
    });
  });

  test("builds path data for message without last_name", () => {
    const msg = createMockMessage("Test", {
      from: {
        id: 123,
        is_bot: false,
        first_name: "Test",
        username: "testuser",
      },
    });
    const result = buildPathData(msg);
    expect(result).toEqual({
      date: "2021-07-21",
      first_name: "Test",
      name: "Test",
      time: "14-00",
      user_id: 123,
      origin_name: "Test",
    });
  });

  test("builds path data with forward origin", () => {
    const msg = createMockMessage("Test", {
      forward_origin: {
        type: "user",
        sender_user: {
          id: 456,
          is_bot: false,
          first_name: "Original",
          last_name: "Sender",
          username: "originaluser",
        },
        date: 1626847200,
      },
    });
    const result = buildPathData(msg);
    expect(result).toEqual({
      date: "2021-07-21",
      first_name: "Test",
      name: "Test User",
      time: "14-00",
      user_id: 123,
      origin_name: "Original Sender",
    });
  });

  test("builds path data for channel post", () => {
    const msg = {
      message_id: 1,
      sender_chat: {
        id: -1001234567890,
        title: "📒 Channel",
        type: "channel",
        username: "channeluser",
      },
      chat: {
        id: -1001234567890,
        title: "📒 Channel",
        type: "channel",
        username: "channeluser",
      },
      date: 1626847200,
      text: "Channel message",
    } as MessageUpdate;
    const result = buildPathData(msg);
    expect(result).toEqual({
      date: "2021-07-21",
      first_name: "📒 Channel",
      name: "📒 Channel",
      time: "14-00",
      user_id: -1001234567890,
      origin_name: "📒 Channel",
    });
  });

  test("handles different times correctly", () => {
    const morningMsg = createMockMessage("Morning", {
      date: 1626843600, // 2021-07-21 13:00:00
    });
    const result = buildPathData(morningMsg);
    expect(result.time).toBe("13-00");
  });

  test("handles different times of day", () => {
    // Test that different timestamps produce different times
    const morningMsg = createMockMessage("Morning", {
      date: 1626843600, // Different timestamp
    });
    const afternoonMsg = createMockMessage("Afternoon", {
      date: 1626847200, // Original timestamp
    });
    
    const morningResult = buildPathData(morningMsg);
    const afternoonResult = buildPathData(afternoonMsg);
    
    // Times should be different
    expect(morningResult.time).not.toBe(afternoonResult.time);
    
    // Both should follow HH-mm format
    expect(morningResult.time).toMatch(/^\d{2}-\d{2}$/);
    expect(afternoonResult.time).toMatch(/^\d{2}-\d{2}$/);
  });
});

describe("buildMsgData", () => {
  test("builds message data for normal message", () => {
    const msg = createMockMessage("Hello world");
    const result = buildMsgData(msg, baseSettings);
    expect(result).toMatchObject({
      message_id: 1,
      text: "Hello world",
      date: "2021-07-21",
      time: "14:00",
      name: "Test User",
      username: "testuser",
      user_id: 123,
    });
  });

  test("builds message data with forward origin", () => {
    const msg = createMockMessage("Forwarded message", {
      forward_origin: {
        type: "user",
        sender_user: {
          id: 456,
          is_bot: false,
          first_name: "Original",
          last_name: "Sender",
          username: "originaluser",
        },
        date: 1626847200,
      },
    });
    const result = buildMsgData(msg, baseSettings);
    expect(result).toMatchObject({
      message_id: 1,
      text: "Forwarded message",
      date: "2021-07-21",
      time: "14:00",
      name: "Test User",
      username: "testuser",
      user_id: 123,
      origin_name: "Original Sender",
      origin_username: "originaluser",
    });
  });

  test("builds message data for channel post", () => {
    const msg = {
      message_id: 1,
      sender_chat: {
        id: -1001234567890,
        title: "📒 Channel",
        type: "channel",
        username: "channeluser",
      },
      chat: {
        id: -1001234567890,
        title: "📒 Channel",
        type: "channel",
        username: "channeluser",
      },
      date: 1626847200,
      text: "Channel message",
    } as MessageUpdate;
    const result = buildMsgData(msg, baseSettings);
    expect(result).toMatchObject({
      message_id: 1,
      text: "Channel message",
      date: "2021-07-21",
      time: "14:00",
      name: "📒 Channel",
      username: "channeluser",
      user_id: -1001234567890,
    });
  });

  test("handles hidden user forward origin", () => {
    const msg = createMockMessage("Hidden user message", {
      forward_origin: {
        type: "hidden_user",
        sender_user_name: "Hidden User",
        date: 1626847200,
      },
    });
    const result = buildMsgData(msg, baseSettings);
    expect(result).toMatchObject({
      origin_name: "Hidden User",
      origin_username: "",
    });
  });

  test("handles channel forward origin", () => {
    const msg = createMockMessage("Channel forward", {
      forward_origin: {
        type: "channel",
        chat: {
          id: -1009876543210,
          title: "Source Channel",
          username: "sourcechannel",
          type: "channel",
        },
        message_id: 42,
        date: 1626847200,
      },
    });
    const result = buildMsgData(msg, baseSettings);
    expect(result).toMatchObject({
      origin_name: "Source Channel",
      origin_username: "sourcechannel",
      origin_link: "https://t.me/sourcechannel/42",
    });
  });

  test("handles chat forward origin with private chat", () => {
    const msg = createMockMessage("Private chat forward", {
      forward_origin: {
        type: "chat",
        sender_chat: {
          id: 789,
          first_name: "Private",
          last_name: "User",
          type: "private",
        },
        date: 1626847200,
      },
    });
    const result = buildMsgData(msg, baseSettings);
    expect(result).toMatchObject({
      origin_name: "Private User",
      origin_username: "",
    });
  });

  test("handles chat forward origin with group", () => {
    const msg = createMockMessage("Group forward", {
      forward_origin: {
        type: "chat",
        sender_chat: {
          id: -100111222333,
          title: "Test Group",
          type: "group",
        },
        date: 1626847200,
      },
    });
    const result = buildMsgData(msg, baseSettings);
    expect(result).toMatchObject({
      origin_name: "Test Group",
      origin_username: "",
    });
  });
});
