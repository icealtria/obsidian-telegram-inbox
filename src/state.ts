import type { MessageUpdate } from "./type";

const MAX_PROCESSED_MESSAGE_KEYS = 5000;
const INITIAL_RETRY_DELAY_MS = 60_000;
const MAX_RETRY_DELAY_MS = 12 * 60 * 60 * 1000;

/**
 * Persistent retry payload for messages that failed to be written to the vault.
 * Timestamps are Unix epoch milliseconds.
 */
export interface RetryQueueItem {
  id: string;
  message_key: string;
  update_id?: number;
  msg: MessageUpdate;
  content: string;
  attempts: number;
  created_at: number;
  next_retry_at: number;
  last_error: string;
}

/**
 * Runtime state stored alongside plugin settings.
 *
 * - `last_processed_update_id` protects polling offsets across restarts.
 * - `processed_message_keys` is a bounded in-memory/persisted dedupe set.
 * - `retry_queue` holds failed writes for manual or automatic retries.
 */
export interface TGInboxRuntimeState {
  last_processed_update_id: number;
  processed_message_keys: string[];
  retry_queue: RetryQueueItem[];
}

export const DEFAULT_RUNTIME_STATE: TGInboxRuntimeState = {
  last_processed_update_id: 0,
  processed_message_keys: [],
  retry_queue: [],
};

/**
 * High-level state API that centralizes dedupe, retry queue, and persistence.
 * Keeping these behaviors in one place avoids inconsistencies in handlers.
 */
export class RuntimeStateStore {
  constructor(
    private state: TGInboxRuntimeState,
    private persist: () => Promise<void>
  ) {}

  /** Returns the highest update id that has been successfully persisted. */
  getLastProcessedUpdateId(): number {
    return this.state.last_processed_update_id;
  }

  /** Builds a stable dedupe key from Telegram chat id and message id. */
  buildMessageKey(msg: MessageUpdate): string {
    return `${msg.chat.id}:${msg.message_id}`;
  }

  /** Checks whether a message key was already persisted before. */
  hasProcessed(messageKey: string): boolean {
    return this.state.processed_message_keys.includes(messageKey);
  }

  /**
   * Marks a message as processed and updates offset tracking.
   * Also removes any pending retry item for the same message key.
   */
  async markProcessed(messageKey: string, updateId?: number): Promise<void> {
    if (!this.hasProcessed(messageKey)) {
      this.state.processed_message_keys.push(messageKey);
      this.trimProcessedMessageKeys();
    }

    if (updateId && updateId > this.state.last_processed_update_id) {
      this.state.last_processed_update_id = updateId;
    }

    this.removeRetryByMessageKey(messageKey);
    await this.persist();
  }

  /** Returns queue items that are ready to run at `now`. */
  getReadyRetries(now = Date.now()): RetryQueueItem[] {
    return this.state.retry_queue.filter((item) => item.next_retry_at <= now);
  }

  /**
   * Adds or refreshes a retry queue item for a message write failure.
   * Existing items keep their attempt counters and retry windows.
   */
  async enqueueRetry(params: {
    messageKey: string;
    updateId?: number;
    msg: MessageUpdate;
    content: string;
    error: string;
  }): Promise<void> {
    const existingItem = this.state.retry_queue.find(
      (item) => item.message_key === params.messageKey
    );

    if (existingItem) {
      existingItem.last_error = params.error;
      await this.persist();
      return;
    }

    this.state.retry_queue.push({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      message_key: params.messageKey,
      update_id: params.updateId,
      msg: params.msg,
      content: params.content,
      attempts: 0,
      created_at: Date.now(),
      next_retry_at: Date.now() + INITIAL_RETRY_DELAY_MS,
      last_error: params.error,
    });

    await this.persist();
  }

  /**
   * Records a failed retry attempt using exponential backoff with a max cap.
   */
  async markRetryAttemptFailure(id: string, error: string): Promise<void> {
    const item = this.state.retry_queue.find((retryItem) => retryItem.id === id);
    if (!item) {
      return;
    }

    item.attempts += 1;
    item.last_error = error;
    const delay = Math.min(
      INITIAL_RETRY_DELAY_MS * 2 ** item.attempts,
      MAX_RETRY_DELAY_MS
    );
    item.next_retry_at = Date.now() + delay;
    await this.persist();
  }

  /** Clears all queued retry entries. */
  async clearRetryQueue(): Promise<void> {
    if (this.state.retry_queue.length === 0) {
      return;
    }
    this.state.retry_queue = [];
    await this.persist();
  }

  /** Returns pending retry item count. */
  getRetryQueueSize(): number {
    return this.state.retry_queue.length;
  }

  private removeRetryByMessageKey(messageKey: string): void {
    this.state.retry_queue = this.state.retry_queue.filter(
      (item) => item.message_key !== messageKey
    );
  }

  private trimProcessedMessageKeys(): void {
    if (this.state.processed_message_keys.length <= MAX_PROCESSED_MESSAGE_KEYS) {
      return;
    }
    this.state.processed_message_keys = this.state.processed_message_keys.slice(
      -MAX_PROCESSED_MESSAGE_KEYS
    );
  }
}
