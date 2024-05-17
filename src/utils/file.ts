import type { File } from "grammy/types";
import type { TGInboxSettings } from "src/settings";
import { getTodayDiary } from "./diary";
import { type TFile, normalizePath, type Vault, moment } from "obsidian";
import { generatePath } from "./template";
import type { MessageUpdate } from "src/type";

export function getExt(path: string) {
	return path.split(".").pop();
}

export function getFileUrl(file: File, token: string) {
	const TG_API = "https://api.telegram.org/file/bot";
	return `${TG_API}${token}/${file.file_path}`;
}


export async function getTargetFile(
	vault: Vault,
	settings: TGInboxSettings,
	msg?: MessageUpdate
): Promise<TFile> {
	if (settings.is_custom_file && msg) {
		let normalizedPath = settings.custom_file_path
			? normalizePath(generatePath(msg, settings))
			: normalizePath('Telegram-Inbox.md');

		if (!normalizedPath.endsWith('.md')) {
			normalizedPath += '.md';
		}

		const file = vault.getFileByPath(normalizedPath);

		if (!file) {
			return await createTargetFile(vault, normalizedPath);
		}
		return file;
	}
	return getTodayDiary();
}

async function createTargetFile(vault: Vault, filePath: string) {
	const dirPath = getDirPath(filePath);
	if (dirPath) {
		await ensureDirExists(vault, dirPath);
	}
	const file = await vault.create(filePath, '');
	console.log(`File created: ${filePath}`);
	return file;
}

async function ensureDirExists(vault: Vault, dirPath: string): Promise<void> {
	const dir = vault.getAbstractFileByPath(dirPath);
	if (!dir) {
		await vault.createFolder(dirPath);
		console.log(`Folder created: ${dirPath}`);
	} else {
		console.log(`Folder already exists: ${dirPath}`);
	}
}

function getDirPath(filePath: string): string {
	const lastSlashIndex = filePath.lastIndexOf('/');
	if (lastSlashIndex === -1) return '';
	return filePath.substring(0, lastSlashIndex);
}