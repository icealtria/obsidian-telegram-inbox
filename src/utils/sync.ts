import { Notice, type Plugin } from "obsidian";

// This function delays the execution of a callback until Obsidian Sync has fully completed.
export function runAfterSync(this: Plugin, cb: () => void) {
    // @ts-ignore
    const sync = this.app?.internalPlugins?.plugins?.sync?.instance;

    if (!sync || sync.syncStatus?.toLowerCase() === "uninitialized") {
        // If sync is not available, execute the callback immediately.
        cb();
        return;
    }

    new Notice("Waiting for Obsidian Sync to complete...");

    if (sync.syncStatus?.toLowerCase() === "fully synced") {
        cb();
        return;
    }

    const handler = () => {
        if (sync.syncStatus?.toLowerCase() === "fully synced") {
            sync.off("status-change", handler);
            cb();
        }
    };

    sync.on("status-change", handler);
}
