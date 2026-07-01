import type { File } from "grammy/types";
import type { TGInboxSettings } from "src/settings/types";
import { getDiaryWithTimeCutoff } from "./diary";
import { type TFile, normalizePath, type Vault } from "obsidian";
import { generatePath } from "./template";
import type { MessageUpdate } from "src/type";
import { moment } from "obsidian";

const TG_API_FILE_URL = "https://api.telegram.org/file/bot";
const TASK_COMMAND_PREFIX = "/task";

export function getExt(path: string): string | undefined {
    return path.split(".").pop();
}

export function getFileUrl(file: File, token: string): string {
    return `${TG_API_FILE_URL}${token}/${file.file_path}`;
}

export async function getSavePath(
    vault: Vault,
    settings: TGInboxSettings,
    msg: MessageUpdate,
): Promise<TFile> {
    if (settings.is_custom_file && settings.custom_file_path && !isTask(msg)) {
        return await getCustomFile(vault, settings, msg);
    }

    return await getDailyNoteFile(settings, msg);
}

async function getCustomFile(
    vault: Vault,
    settings: TGInboxSettings,
    msg: MessageUpdate
): Promise<TFile> {
    let normalizedPath = normalizePath(generatePath(msg, settings));

    if (!normalizedPath.endsWith(".md")) {
        normalizedPath += ".md";
    }

    const file = vault.getFileByPath(normalizedPath);

    if (file) {
        return file;
    }

    console.debug(`File not found. Creating new file at: ${normalizedPath}`);
    return await createTargetFile(vault, normalizedPath);
}

async function getDailyNoteFile(
    settings: TGInboxSettings,
    msg: MessageUpdate
): Promise<TFile> {
    const messageDate = moment(msg.date * 1000);
    const file = await getDiaryWithTimeCutoff(settings, messageDate);
    if (!file) {
        throw new Error("Failed to resolve or create the daily note");
    }
    return file;
}

async function createTargetFile(vault: Vault, filePath: string): Promise<TFile> {
    console.debug(`Creating target file: ${filePath}`);

    const dirPath = getDirPath(filePath);
    if (dirPath) {
        console.debug(`Directory path extracted: ${dirPath}`);
        await ensureDirExists(vault, dirPath);
    }

    try {
        const file = await vault.create(filePath, "");
        console.log(`File created: ${filePath}`);
        return file;
    } catch (e) {
        // The file may already exist on disk (e.g. the index hadn't caught up
        // when getFileByPath was consulted). Re-resolve it instead of dropping
        // the message.
        const existing = vault.getFileByPath(filePath);
        if (existing) {
            return existing;
        }
        throw e;
    }
}

async function ensureDirExists(vault: Vault, dirPath: string): Promise<void> {
    if (vault.getAbstractFileByPath(dirPath)) {
        console.debug(`Folder already exists: ${dirPath}`);
        return;
    }

    // The metadata index can lag the filesystem (notably during the startup
    // burst before the workspace is ready), so a folder that physically
    // exists may not resolve above. Check the adapter and treat an
    // "already exists" error as success so createFolder can't drop a message.
    try {
        if (await vault.adapter.exists(dirPath)) {
            return;
        }
        await vault.createFolder(dirPath);
        console.log(`Folder created: ${dirPath}`);
    } catch (e) {
        if (e instanceof Error && /already exists/i.test(e.message)) {
            console.debug(`Folder already exists (race): ${dirPath}`);
            return;
        }
        throw e;
    }
}

function getDirPath(filePath: string): string {
    const lastSlashIndex = filePath.lastIndexOf("/");
    return lastSlashIndex === -1 ? "" : filePath.substring(0, lastSlashIndex);
}

export function isTask(msg: MessageUpdate): boolean {
    const text = msg.text || "";
    const trimmed = text.trim().toLowerCase();
    return trimmed === TASK_COMMAND_PREFIX || trimmed.startsWith(TASK_COMMAND_PREFIX + " ");
}
