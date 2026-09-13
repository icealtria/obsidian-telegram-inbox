import assert from "node:assert/strict";
import { describe, test, beforeEach } from "node:test";
import { insertMessageAfterHeading } from "../src/io";
import type { TFile, Vault } from "obsidian";

describe("insertMessageAfterHeading", () => {
    let mockFileData: string;
    const mockFile = {} as TFile;
    const mockVault = {
        process: async (file: TFile, fn: (data: string) => string) => {
            mockFileData = fn(mockFileData);
        }
    } as unknown as Vault;

    beforeEach(() => {
        mockFileData = "";
    });

    test("inserts message at bottom of section", async () => {
        mockFileData = "## Heading 1\nContent 1\n## Inbox\nContent 2";
        const message = "New message";
        const heading = "## Inbox";

        await insertMessageAfterHeading(mockVault, message, mockFile, heading);

        const expected = "## Heading 1\nContent 1\n## Inbox\nContent 2\nNew message";
        assert.strictEqual(mockFileData, expected);
    });

    test("inserts after last content, not before next heading", async () => {
        mockFileData = "## Inbox\nContent 1\n\n## Other\nContent 2";
        const message = "New message";
        const heading = "## Inbox";

        await insertMessageAfterHeading(mockVault, message, mockFile, heading);

        const expected = "## Inbox\nContent 1\nNew message\n\n## Other\nContent 2";
        assert.strictEqual(mockFileData, expected);
    });

    test("inserts after heading when section is empty", async () => {
        mockFileData = "## Inbox\n\n## Other\nContent";
        const message = "New message";
        const heading = "## Inbox";

        await insertMessageAfterHeading(mockVault, message, mockFile, heading);

        const expected = "## Inbox\nNew message\n\n## Other\nContent";
        assert.strictEqual(mockFileData, expected);
    });

    test("inserts before next same-level heading", async () => {
        mockFileData = "## Inbox\nContent 1\n## Other\nContent 2";
        const message = "New message";
        const heading = "## Inbox";

        await insertMessageAfterHeading(mockVault, message, mockFile, heading);

        const expected = "## Inbox\nContent 1\nNew message\n## Other\nContent 2";
        assert.strictEqual(mockFileData, expected);
    });

    test("inserts before next higher-level heading", async () => {
        mockFileData = "## Inbox\nContent 1\n# Top Level\nContent 2";
        const message = "New message";
        const heading = "## Inbox";

        await insertMessageAfterHeading(mockVault, message, mockFile, heading);

        const expected = "## Inbox\nContent 1\nNew message\n# Top Level\nContent 2";
        assert.strictEqual(mockFileData, expected);
    });

    test("does not stop at deeper nested headings", async () => {
        mockFileData = "## Inbox\nContent 1\n### Sub\nSub content\n## Other";
        const message = "New message";
        const heading = "## Inbox";

        await insertMessageAfterHeading(mockVault, message, mockFile, heading);

        const expected = "## Inbox\nContent 1\n### Sub\nSub content\nNew message\n## Other";
        assert.strictEqual(mockFileData, expected);
    });

    test("reverse inserts right after heading", async () => {
        mockFileData = "## Inbox\nContent 1\n## Other";
        const message = "New message";
        const heading = "## Inbox";

        await insertMessageAfterHeading(mockVault, message, mockFile, heading, true);

        const expected = "## Inbox\nNew message\nContent 1\n## Other";
        assert.strictEqual(mockFileData, expected);
    });

    test("creates heading at the end if it doesn't exist", async () => {
        mockFileData = "## Heading 1\nContent 1";
        const message = "New message";
        const heading = "## Inbox";

        await insertMessageAfterHeading(mockVault, message, mockFile, heading);

        const expected = "## Heading 1\nContent 1\n\n## Inbox\nNew message";
        assert.strictEqual(mockFileData, expected);
    });

    test("handles empty file by creating heading without leading newline", async () => {
        mockFileData = "";
        const message = "New message";
        const heading = "## Inbox";

        await insertMessageAfterHeading(mockVault, message, mockFile, heading);

        const expected = "## Inbox\nNew message";
        assert.strictEqual(mockFileData, expected);
    });

    test("handles file with trailing newline when creating heading", async () => {
        mockFileData = "## Heading 1\nContent 1\n";
        const message = "New message";
        const heading = "## Inbox";

        await insertMessageAfterHeading(mockVault, message, mockFile, heading);

        const expected = "## Heading 1\nContent 1\n\n## Inbox\nNew message";
        assert.strictEqual(mockFileData, expected);
    });

    test("matches heading regardless of trailing spaces", async () => {
        mockFileData = "## Inbox  \nContent";
        const message = "New message";
        const heading = "## Inbox";

        await insertMessageAfterHeading(mockVault, message, mockFile, heading);

        const expected = "## Inbox  \nContent\nNew message";
        assert.strictEqual(mockFileData, expected);
    });
});
