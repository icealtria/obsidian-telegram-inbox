import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { toMarkdownV2 } from "../src/utils/markdown";
import type { TGInboxSettings } from "src/settings/types";
import type { MsgNonChannel } from "src/type";

const baseSettings: TGInboxSettings = {
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
};

function createMockMessage(text: string | undefined, entities?: any[]): MsgNonChannel {
  return {
    message_id: 1,
    from: {
      id: 123,
      is_bot: false,
      first_name: "Test",
      username: "testuser",
    },
    chat: {
      id: 123,
      first_name: "Test",
      username: "testuser",
      type: "private",
    },
    date: 1626847200,
    text,
    entities,
  } as MsgNonChannel;
}

describe("toMarkdownV2", () => {
  test("returns plain text when no entities", () => {
    const msg = createMockMessage("Hello world");
    const result = toMarkdownV2(msg, baseSettings);
    assert.strictEqual(result, "Hello world");
  });

  test("converts bold text", () => {
    const msg = createMockMessage("Hello bold world", [
      { type: "bold", offset: 6, length: 4 },
    ]);
    const result = toMarkdownV2(msg, baseSettings);
    assert.strictEqual(result, "Hello **bold** world");
  });

  test("converts italic text", () => {
    const msg = createMockMessage("Hello italic world", [
      { type: "italic", offset: 6, length: 6 },
    ]);
    const result = toMarkdownV2(msg, baseSettings);
    assert.strictEqual(result, "Hello *italic* world");
  });

  test("converts underline text", () => {
    const msg = createMockMessage("Hello underline world", [
      { type: "underline", offset: 6, length: 9 },
    ]);
    const result = toMarkdownV2(msg, baseSettings);
    assert.strictEqual(result, "Hello <u>underline</u> world");
  });

  test("converts strikethrough text", () => {
    const msg = createMockMessage("Hello strikethrough world", [
      { type: "strikethrough", offset: 6, length: 13 },
    ]);
    const result = toMarkdownV2(msg, baseSettings);
    assert.strictEqual(result, "Hello ~~strikethrough~~ world");
  });

  test("converts inline code", () => {
    const msg = createMockMessage("Hello code world", [
      { type: "code", offset: 6, length: 4 },
    ]);
    const result = toMarkdownV2(msg, baseSettings);
    assert.strictEqual(result, "Hello `code` world");
  });

  test("converts preformatted code block", () => {
    const msg = createMockMessage("Hello code block world", [
      { type: "pre", offset: 6, length: 10 },
    ]);
    const result = toMarkdownV2(msg, baseSettings);
    assert.strictEqual(result, "Hello ```\ncode block\n``` world");
  });

  test("converts spoiler text", () => {
    const msg = createMockMessage("Hello spoiler world", [
      { type: "spoiler", offset: 6, length: 7 },
    ]);
    const result = toMarkdownV2(msg, baseSettings);
    assert.strictEqual(result, "Hello ==spoiler== world");
  });

  test("converts text link", () => {
    const msg = createMockMessage("Hello link world", [
      { type: "text_link", offset: 6, length: 4, url: "https://example.com" },
    ]);
    const result = toMarkdownV2(msg, baseSettings);
    assert.strictEqual(result, "Hello [link](https://example.com) world");
  });

  test("converts URL", () => {
    const msg = createMockMessage("Hello https://example.com world", [
      { type: "url", offset: 6, length: 19 },
    ]);
    const result = toMarkdownV2(msg, baseSettings);
    assert.strictEqual(result, "Hello https://example.com world");
  });

  test("converts text mention", () => {
    const msg = createMockMessage("Hello @user world", [
      { type: "text_mention", offset: 6, length: 5, user: { id: 12345 } },
    ]);
    const result = toMarkdownV2(msg, baseSettings);
    assert.strictEqual(result, "Hello [@user](tg://user?id=12345) world");
  });

  test("converts blockquote", () => {
    const msg = createMockMessage("Hello blockquote", [
      { type: "blockquote", offset: 6, length: 10 },
    ]);
    const result = toMarkdownV2(msg, baseSettings);
    assert.strictEqual(result, "Hello >blockquote");
  });

  test("converts multi-line blockquote", () => {
    const msg = createMockMessage("Hello line1\nline2 world", [
      { type: "blockquote", offset: 6, length: 11 },
    ]);
    const result = toMarkdownV2(msg, baseSettings);
    assert.strictEqual(result, "Hello >line1\n>line2 world");
  });

  test("handles multiple entities", () => {
    const msg = createMockMessage("Hello bold and italic world", [
      { type: "bold", offset: 6, length: 4 },
      { type: "italic", offset: 15, length: 6 },
    ]);
    const result = toMarkdownV2(msg, baseSettings);
    assert.strictEqual(result, "Hello **bold** and *italic* world");
  });

  test("returns plain text when remove_formatting is true", () => {
    const msg = createMockMessage("Hello **bold** world");
    const settings = { ...baseSettings, remove_formatting: true };
    const result = toMarkdownV2(msg, settings);
    assert.strictEqual(result, "Hello **bold** world");
  });

  test("handles mention entity (returns as-is)", () => {
    const msg = createMockMessage("Hello @username world", [
      { type: "mention", offset: 6, length: 9 },
    ]);
    const result = toMarkdownV2(msg, baseSettings);
    assert.strictEqual(result, "Hello @username world");
  });

  test("handles hashtag entity (returns as-is)", () => {
    const msg = createMockMessage("Hello #hashtag world", [
      { type: "hashtag", offset: 6, length: 8 },
    ]);
    const result = toMarkdownV2(msg, baseSettings);
    assert.strictEqual(result, "Hello #hashtag world");
  });

  test("handles bot_command entity (returns as-is)", () => {
    const msg = createMockMessage("Hello /start world", [
      { type: "bot_command", offset: 6, length: 6 },
    ]);
    const result = toMarkdownV2(msg, baseSettings);
    assert.strictEqual(result, "Hello /start world");
  });

  test("handles email entity (returns as-is)", () => {
    const msg = createMockMessage("Hello test@example.com world", [
      { type: "email", offset: 6, length: 16 },
    ]);
    const result = toMarkdownV2(msg, baseSettings);
    assert.strictEqual(result, "Hello test@example.com world");
  });

  test("handles phone_number entity (returns as-is)", () => {
    const msg = createMockMessage("Hello +1234567890 world", [
      { type: "phone_number", offset: 6, length: 11 },
    ]);
    const result = toMarkdownV2(msg, baseSettings);
    assert.strictEqual(result, "Hello +1234567890 world");
  });

  test("handles cashtag entity (returns as-is)", () => {
    const msg = createMockMessage("Hello $BTC world", [
      { type: "cashtag", offset: 6, length: 4 },
    ]);
    const result = toMarkdownV2(msg, baseSettings);
    assert.strictEqual(result, "Hello $BTC world");
  });

  test("handles custom_emoji entity (returns as-is)", () => {
    const msg = createMockMessage("Hello 👍 world", [
      { type: "custom_emoji", offset: 6, length: 2 },
    ]);
    const result = toMarkdownV2(msg, baseSettings);
    assert.strictEqual(result, "Hello 👍 world");
  });
});
