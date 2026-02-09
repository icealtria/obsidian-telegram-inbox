import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { appendMessage } from "../src/io";

describe("appendMessage", () => {
  test("appends message to empty content", () => {
    const existingContent = "";
    const message = "New message";
    const result = appendMessage(existingContent, message);
    assert.strictEqual(result, "New message");
  });

  test("appends message to content without trailing newline", () => {
    const existingContent = "Existing content";
    const message = "New message";
    const result = appendMessage(existingContent, message);
    assert.strictEqual(result, "Existing content\nNew message");
  });

  test("appends message to content with trailing newline", () => {
    const existingContent = "Existing content\n";
    const message = "New message";
    const result = appendMessage(existingContent, message);
    assert.strictEqual(result, "Existing content\nNew message");
  });

  test("handles content with only whitespace", () => {
    const existingContent = "   \n\t  ";
    const message = "New message";
    const result = appendMessage(existingContent, message);
    assert.strictEqual(result, "New message");
  });

  test("handles multiple lines of existing content", () => {
    const existingContent = "Line 1\nLine 2\nLine 3";
    const message = "New message";
    const result = appendMessage(existingContent, message);
    assert.strictEqual(result, "Line 1\nLine 2\nLine 3\nNew message");
  });

  test("handles multiple trailing newlines", () => {
    const existingContent = "Existing content\n\n\n";
    const message = "New message";
    const result = appendMessage(existingContent, message);
    assert.strictEqual(result, "Existing content\n\n\nNew message");
  });

  test("handles message with special characters", () => {
    const existingContent = "Existing content";
    const message = "Special chars: !@#$%^&*()";
    const result = appendMessage(existingContent, message);
    assert.strictEqual(result, "Existing content\nSpecial chars: !@#$%^&*()");
  });

  test("handles markdown content", () => {
    const existingContent = "# Header\n\nSome **bold** text";
    const message = "New paragraph";
    const result = appendMessage(existingContent, message);
    assert.strictEqual(result, "# Header\n\nSome **bold** text\nNew paragraph");
  });

  test("handles empty message", () => {
    const existingContent = "Existing content";
    const message = "";
    const result = appendMessage(existingContent, message);
    assert.strictEqual(result, "Existing content\n");
  });

  test("handles both empty content and message", () => {
    const existingContent = "";
    const message = "";
    const result = appendMessage(existingContent, message);
    assert.strictEqual(result, "");
  });
});
