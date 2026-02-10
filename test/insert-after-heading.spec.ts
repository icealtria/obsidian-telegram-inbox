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

    test("inserts message after existing heading", async () => {
        mockFileData = "## Heading 1\nContent 1\n## Inbox\nContent 2";
        const message = "New message";
        const heading = "## Inbox";

        await insertMessageAfterHeading(mockVault, message, mockFile, heading);

        const expected = "## Heading 1\nContent 1\n## Inbox\nNew message\nContent 2";
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

        const expected = "## Inbox  \nNew message\nContent";
        assert.strictEqual(mockFileData, expected);
    });
});
