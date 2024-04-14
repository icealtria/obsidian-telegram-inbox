import { normalizePath, requestUrl } from "obsidian";

function downloadAsArrayBuffer(url: string): Promise<ArrayBuffer> {
    return requestUrl(url).arrayBuffer;
}


export async function downloadAndSaveFile(url: string, filename_ext: string, download_dir: string): Promise<boolean> {
    try {
        const fileArrayBuffer = await downloadAsArrayBuffer(url);
        this.app.vault.createBinary(
            normalizePath(`${download_dir}/${filename_ext}`),
            fileArrayBuffer
        );
        return true;
    } catch (error) {
        console.error("Error downloading file:", error);
        return false;
    }
}