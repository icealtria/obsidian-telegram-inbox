import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { generateFilename } from "../src/bot/utils";
import type { Message, File } from "grammy/types";

function createMockMessage(
  messageId: number,
  date: number
): Message {
  return {
    message_id: messageId,
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
    date,
    text: "Test message",
  } as Message;
}

function createMockFile(filePath: string): File {
  return {
    file_id: "test_file_id",
    file_unique_id: "test_unique_id",
    file_path: filePath,
    file_size: 1024,
  };
}

describe("generateFilename", () => {
  test("generates filename with jpg extension", () => {
    const msg = createMockMessage(123, 1626847200);
    const file = createMockFile("photos/file_123.jpg");
    const result = generateFilename(msg, file);
    assert.strictEqual(result, "20210721-123.jpg");
  });

  test("generates filename with png extension", () => {
    const msg = createMockMessage(456, 1626847200);
    const file = createMockFile("photos/file_456.png");
    const result = generateFilename(msg, file);
    assert.strictEqual(result, "20210721-456.png");
  });

  test("generates filename with mp4 extension", () => {
    const msg = createMockMessage(789, 1626847200);
    const file = createMockFile("videos/file_789.mp4");
    const result = generateFilename(msg, file);
    assert.strictEqual(result, "20210721-789.mp4");
  });

  test("generates filename with pdf extension", () => {
    const msg = createMockMessage(100, 1626847200);
    const file = createMockFile("documents/file_100.pdf");
    const result = generateFilename(msg, file);
    assert.strictEqual(result, "20210721-100.pdf");
  });

  test("handles different dates correctly", () => {
    const msg = createMockMessage(1, 1609459200); // 2021-01-01
    const file = createMockFile("photos/file.jpg");
    const result = generateFilename(msg, file);
    assert.strictEqual(result, "20210101-1.jpg");
  });

  test("handles large message IDs", () => {
    const msg = createMockMessage(999999, 1626847200);
    const file = createMockFile("photos/file.jpg");
    const result = generateFilename(msg, file);
    assert.strictEqual(result, "20210721-999999.jpg");
  });

  test("handles file without extension", () => {
    const msg = createMockMessage(1, 1626847200);
    const file = createMockFile("photos/file");
    const result = generateFilename(msg, file);
    assert.strictEqual(result, "20210721-1.photos/file");
  });

  test("handles file with multiple dots in path", () => {
    const msg = createMockMessage(1, 1626847200);
    const file = createMockFile("photos/v2.0/file.name.jpg");
    const result = generateFilename(msg, file);
    assert.strictEqual(result, "20210721-1.jpg");
  });

  test("handles empty file path", () => {
    const msg = createMockMessage(1, 1626847200);
    const file = createMockFile("");
    const result = generateFilename(msg, file);
    assert.strictEqual(result, "20210721-1.");
  });

  test("handles uppercase extensions", () => {
    const msg = createMockMessage(1, 1626847200);
    const file = createMockFile("photos/file.JPG");
    const result = generateFilename(msg, file);
    assert.strictEqual(result, "20210721-1.JPG");
  });

  test("handles complex file paths", () => {
    const msg = createMockMessage(12345, 1626847200);
    const file = createMockFile("path/to/deep/nested/folder/image.jpeg");
    const result = generateFilename(msg, file);
    assert.strictEqual(result, "20210721-12345.jpeg");
  });
});
