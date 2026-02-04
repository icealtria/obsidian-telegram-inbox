import { describe, expect, test } from "@jest/globals";
import { appendMessage } from "../src/io";

describe("appendMessage", () => {
  test("appends message to empty content", () => {
    const existingContent = "";
    const message = "New message";
    const result = appendMessage(existingContent, message);
    expect(result).toBe("New message");
  });

  test("appends message to content without trailing newline", () => {
    const existingContent = "Existing content";
    const message = "New message";
    const result = appendMessage(existingContent, message);
    expect(result).toBe("Existing content\nNew message");
  });

  test("appends message to content with trailing newline", () => {
    const existingContent = "Existing content\n";
    const message = "New message";
    const result = appendMessage(existingContent, message);
    expect(result).toBe("Existing content\nNew message");
  });

  test("handles content with only whitespace", () => {
    const existingContent = "   \n\t  ";
    const message = "New message";
    const result = appendMessage(existingContent, message);
    expect(result).toBe("New message");
  });

  test("handles multiple lines of existing content", () => {
    const existingContent = "Line 1\nLine 2\nLine 3";
    const message = "New message";
    const result = appendMessage(existingContent, message);
    expect(result).toBe("Line 1\nLine 2\nLine 3\nNew message");
  });

  test("handles multiple trailing newlines", () => {
    const existingContent = "Existing content\n\n\n";
    const message = "New message";
    const result = appendMessage(existingContent, message);
    expect(result).toBe("Existing content\n\n\nNew message");
  });

  test("handles message with special characters", () => {
    const existingContent = "Existing content";
    const message = "Special chars: !@#$%^&*()";
    const result = appendMessage(existingContent, message);
    expect(result).toBe("Existing content\nSpecial chars: !@#$%^&*()");
  });

  test("handles markdown content", () => {
    const existingContent = "# Header\n\nSome **bold** text";
    const message = "New paragraph";
    const result = appendMessage(existingContent, message);
    expect(result).toBe("# Header\n\nSome **bold** text\nNew paragraph");
  });

  test("handles empty message", () => {
    const existingContent = "Existing content";
    const message = "";
    const result = appendMessage(existingContent, message);
    expect(result).toBe("Existing content\n");
  });

  test("handles both empty content and message", () => {
    const existingContent = "";
    const message = "";
    const result = appendMessage(existingContent, message);
    expect(result).toBe("");
  });
});
