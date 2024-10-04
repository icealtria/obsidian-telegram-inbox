import type { File } from "grammy/types";
import type { TGInboxSettings } from "src/settings";
import { getTodayDiary } from "./diary";
import { type TFile, normalizePath, type Vault } from "obsidian";
import { generatePath } from "./template";
import type { MessageUpdate } from "src/type";

export function getExt(path: string) {
	return path.split(".").pop();
}

export function getFileUrl(file: File, token: string) {
	const TG_API = "https://api.telegram.org/file/bot";
	return `${TG_API}${token}/${file.file_path}`;
}


export async function getSavePath(
    vault: Vault,
    settings: TGInboxSettings,
    msg?: MessageUpdate
): Promise<TFile> {
    try {
        if (settings.is_custom_file && msg && settings.custom_file_path) {
            let normalizedPath = normalizePath(generatePath(msg, settings));
            normalizedPath = ensureMdExtension(normalizedPath);

            const file = vault.getFileByPath(normalizedPath);

            if (!file) {
                console.debug(`File not found. Creating new file at: ${normalizedPath}`);
                return await createTargetFile(vault, normalizedPath);
            }
            return file;
        }
        return getTodayDiary();
    } catch (error) {
        console.error(`Error in getSavedPath: ${error}`);
        throw error;
    }
}

function ensureMdExtension(path: string): string {
    return path.endsWith('.md') ? path : `${path}.md`;
}

async function createTargetFile(vault: Vault, filePath: string): Promise<TFile> {
    try {
        console.debug(`Creating target file: ${filePath}`);
        const dirPath = getDirPath(filePath);
        if (dirPath) {
            console.debug(`Directory path extracted: ${dirPath}`);
            await ensureDirExists(vault, dirPath);
        }
        const file = await vault.create(filePath, '');
        console.log(`File created: ${filePath}`);
        return file;
    } catch (error) {
        console.error(`Error creating target file: ${error}`);
        throw error;
    }
}

async function ensureDirExists(vault: Vault, dirPath: string): Promise<void> {
    try {
        const dir = vault.getAbstractFileByPath(dirPath);
        if (!dir) {
            await vault.createFolder(dirPath);
            console.log(`Folder created: ${dirPath}`);
        } else {
            console.log(`Folder already exists: ${dirPath}`);
        }
    } catch (error) {
        console.error(`Error ensuring directory exists: ${error}`);
        throw error;
    }
}

function getDirPath(filePath: string): string {
	const lastSlashIndex = filePath.lastIndexOf('/');
	if (lastSlashIndex === -1) return '';
	return filePath.substring(0, lastSlashIndex);
}