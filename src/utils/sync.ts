import { Notice, type Plugin } from "obsidian";

function waitForObsidianSync(sync: any, cb: () => void) {
    if (!sync || sync.syncStatus?.toLowerCase() === "uninitialized") {
        // If sync is not available, execute the callback immediately.
        console.debug("Obsidian Sync plugin not detected or uninitialized.");
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

function waitForRemotelySaveSync(remotely_save: any, cb: () => void) {
    console.debug("Remotely Save plugin detected.");
    const initRunAfterMilliseconds = remotely_save.settings.initRunAfterMilliseconds;
    console.debug("Remotely Save initRunAfterMilliseconds:", initRunAfterMilliseconds);
    if (!initRunAfterMilliseconds) {
        cb();
        return;
    } else {
        // If Remotely Save is enabled, we need to wait for it to finish.
        new Notice("Waiting for Remotely Save to complete...");
        setTimeout(() => {
            const interval = setInterval(() => {
                if (!remotely_save.isSyncing) {
                    console.debug("Remotely Save finished syncing.");
                    clearInterval(interval);
                    cb();
                }
            }, 500);
        }, initRunAfterMilliseconds);
        return;
    }
}

function waitForRemotelySync(remotely_sync: any, cb: () => void) {
    console.debug("Remotely Sync plugin detected.");
    const initRunAfterMilliseconds = remotely_sync.settings.initRunAfterMilliseconds;
    console.debug("Remotely Sync initRunAfterMilliseconds:", initRunAfterMilliseconds);
    if (!initRunAfterMilliseconds) {
        cb();
        return;
    } else {
        // If Remotely Secure is enabled, we need to wait for it to finish.
        new Notice("Waiting for Remotely Sync to complete...");
        setTimeout(() => {
            const interval = setInterval(() => {
                if (remotely_sync.syncStatus === "idle") {
                    console.debug("Remotely Sync finished syncing.");
                    clearInterval(interval);
                    cb();
                }
            }, 500);
        }, initRunAfterMilliseconds);
        return;
    }
}

export function runAfterSync(this: Plugin, cb: () => void) {
    // @ts-ignore
    const remotely_save = this.app.plugins.plugins["remotely-save"];
    // @ts-ignore
    const remotely_sync = this.app.plugins.plugins["remotely-secure"];
    // @ts-ignore
    const sync = this.app?.internalPlugins?.plugins?.sync?.instance;

    let waitCount = 0;
    const total = [remotely_save, remotely_sync, sync].filter(Boolean).length;
    if (total === 0) {
        cb();
        return;
    }
    const done = () => {
        waitCount++;
        if (waitCount === total) {
            cb();
        }
    };
    if (remotely_save) waitForRemotelySaveSync(remotely_save, done);
    if (remotely_sync) waitForRemotelySync(remotely_sync, done);
    if (sync) waitForObsidianSync(sync, done);
}
