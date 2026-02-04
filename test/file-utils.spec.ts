import { describe, expect, test } from "@jest/globals";
import { getExt, getFileUrl, isTask } from "../src/utils/file";
import type { File } from "grammy/types";
import type { MessageUpdate } from "../src/type";

jest.mock("obsidian");

describe("getExt", () => {
  test("extracts jpg extension", () => {
    expect(getExt("photos/file_123.jpg")).toBe("jpg");
  });

  test("extracts png extension", () => {
    expect(getExt("images/picture.png")).toBe("png");
  });

  test("extracts mp4 extension", () => {
    expect(getExt("videos/movie.mp4")).toBe("mp4");
  });

  test("extracts pdf extension", () => {
    expect(getExt("documents/file.pdf")).toBe("pdf");
  });

  test("handles files without extension", () => {
    expect(getExt("path/to/file")).toBe("path/to/file");
  });

  test("handles empty path", () => {
    expect(getExt("")).toBe("");
  });

  test("handles path with multiple dots", () => {
    expect(getExt("path/to/file.name.with.dots.txt")).toBe("txt");
  });

  test("handles uppercase extensions", () => {
    expect(getExt("photos/file.JPG")).toBe("JPG");
  });

  test("handles file starting with dot", () => {
    expect(getExt(".gitignore")).toBe("gitignore");
  });

  test("handles complex paths", () => {
    expect(getExt("/very/long/path/to/the/file/document.docx")).toBe("docx");
  });

  test("handles filename with only extension", () => {
    expect(getExt(".env")).toBe("env");
  });
});

describe("getFileUrl", () => {
  test("generates correct file URL", () => {
    const file: File = {
      file_id: "test123",
      file_unique_id: "unique456",
      file_path: "photos/file_123.jpg",
      file_size: 1024,
    };
    const token = "bot_token_123";
    const result = getFileUrl(file, token);
    expect(result).toBe("https://api.telegram.org/file/botbot_token_123/photos/file_123.jpg");
  });

  test("handles different file paths", () => {
    const file: File = {
      file_id: "test456",
      file_unique_id: "unique789",
      file_path: "documents/report.pdf",
      file_size: 2048,
    };
    const token = "my_bot_token";
    const result = getFileUrl(file, token);
    expect(result).toBe("https://api.telegram.org/file/botmy_bot_token/documents/report.pdf");
  });

  test("handles videos", () => {
    const file: File = {
      file_id: "video123",
      file_unique_id: "video456",
      file_path: "videos/movie.mp4",
      file_size: 10485760,
    };
    const token = "video_bot";
    const result = getFileUrl(file, token);
    expect(result).toBe("https://api.telegram.org/file/botvideo_bot/videos/movie.mp4");
  });

  test("handles empty file path", () => {
    const file: File = {
      file_id: "empty",
      file_unique_id: "empty_unique",
      file_path: "",
      file_size: 0,
    };
    const token = "test_token";
    const result = getFileUrl(file, token);
    expect(result).toBe("https://api.telegram.org/file/bottest_token/");
  });
});

describe("isTask", () => {
  function createMockMessage(text: string): MessageUpdate {
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
    } as MessageUpdate;
  }

  test("returns true for /task command", () => {
    const msg = createMockMessage("/task Buy groceries");
    expect(isTask(msg)).toBe(true);
  });

  test("returns true for /TASK (uppercase)", () => {
    const msg = createMockMessage("/TASK Buy groceries");
    expect(isTask(msg)).toBe(true);
  });

  test("returns true for /Task (mixed case)", () => {
    const msg = createMockMessage("/Task Buy groceries");
    expect(isTask(msg)).toBe(true);
  });

  test("returns true for /task with leading spaces", () => {
    const msg = createMockMessage("  /task Buy groceries");
    expect(isTask(msg)).toBe(true);
  });

  test("returns false for regular text", () => {
    const msg = createMockMessage("Hello world");
    expect(isTask(msg)).toBe(false);
  });

  test("returns false for other commands", () => {
    const msg = createMockMessage("/start");
    expect(isTask(msg)).toBe(false);
  });

  test("returns false for /taskword (starts with /task)", () => {
    const msg = createMockMessage("/taskword something");
    expect(isTask(msg)).toBe(false);
  });

  test("returns false for text containing /task", () => {
    const msg = createMockMessage("This is a /task in the middle");
    expect(isTask(msg)).toBe(false);
  });

  test("returns false for empty text", () => {
    const msg = createMockMessage("");
    expect(isTask(msg)).toBe(false);
  });

  test("returns false for undefined text", () => {
    const msg = {
      message_id: 1,
      from: {
        id: 123,
        is_bot: false,
        first_name: "Test",
      },
      chat: {
        id: 123,
        first_name: "Test",
        type: "private",
      },
      date: 1626847200,
    } as MessageUpdate;
    expect(isTask(msg)).toBe(false);
  });

  test("returns true for /task only (no description)", () => {
    const msg = createMockMessage("/task");
    expect(isTask(msg)).toBe(true);
  });

  test("returns true for /task with trailing spaces", () => {
    const msg = createMockMessage("/task   ");
    expect(isTask(msg)).toBe(true);
  });
});
