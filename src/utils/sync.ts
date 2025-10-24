/* eslint-disable @typescript-eslint/no-explicit-any */

import { App, Notice, type Plugin } from "obsidian";

function waitForObsidianSync(sync: any, cb: () => void) {
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
    const remotely_save = getRemotelySave(this.app);
    const remotely_sync = getRemotelySync(this.app);
    const sync = getSync(this.app);

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

export function hasSyncPlugin(app: App): boolean {
    const sync = getSync(app);
    const remotely_save = getRemotelySave(app);
    const remotely_sync = getRemotelySync(app);
    return !!(sync || remotely_save || remotely_sync);
}

export function getRemotelySave(app: App): any | null {
    // @ts-ignore
    return app.plugins.plugins["remotely-save"] || null;
}

export function getRemotelySync(app: App): any | null {
    // @ts-ignore
    return app.plugins.plugins["remotely-secure"] || null;
}

export function getSync(app: App): any | null {
    // @ts-ignore
    const sync = app.internalPlugins?.plugins?.sync?.instance;
    return sync && sync.syncStatus?.toLowerCase() !== "uninitialized" ? sync : null;
}

export function getSyncStatus(app: App): {
    obsidianSync: boolean;
    remotelySave: boolean;
    remotelySync: boolean;
} {
    const sync = getSync(app);
    const remotely_save = getRemotelySave(app);
    const remotely_sync = getRemotelySync(app);
    return {
        obsidianSync: !!sync,
        remotelySave: !!remotely_save,
        remotelySync: !!remotely_sync,
    };
}