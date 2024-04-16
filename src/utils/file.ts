import { File } from "grammy/types";

export function getExt(path: string) {
    return path.split(".").pop();
}

export function getFileUrl(file: File, token: string) {
    const TG_API = "https://api.telegram.org/file/bot";
    return `${TG_API}${token}/${file.file_path}`;
}