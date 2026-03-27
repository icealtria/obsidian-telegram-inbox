import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { DEFAULT_RUNTIME_STATE, RuntimeStateStore } from "../src/state";
import type { MessageUpdate } from "../src/type";

function createMessage(chatId: number, messageId: number): MessageUpdate {
  return {
    message_id: messageId,
    from: {
      id: 123,
      is_bot: false,
      first_name: "Test",
    },
    chat: {
      id: chatId,
      first_name: "Test",
      type: "private",
    },
    date: 1710000000,
    text: "hello",
  } as MessageUpdate;
}

function createStore() {
  const state = structuredClone(DEFAULT_RUNTIME_STATE);
  let persistCalls = 0;
  const store = new RuntimeStateStore(state, async () => {
    persistCalls += 1;
  });
  return { state, store, getPersistCalls: () => persistCalls };
}

describe("RuntimeStateStore", () => {
  test("builds stable message key", () => {
    const { store } = createStore();
    const key = store.buildMessageKey(createMessage(42, 99));
    assert.strictEqual(key, "42:99");
  });

  test("marks message processed and updates update id", async () => {
    const { state, store, getPersistCalls } = createStore();
    const key = store.buildMessageKey(createMessage(10, 55));

    await store.markProcessed(key, 777);

    assert.equal(store.hasProcessed(key), true);
    assert.equal(state.last_processed_update_id, 777);
    assert.equal(getPersistCalls(), 1);
  });

  test("removes retry entry once message is processed", async () => {
    const { state, store } = createStore();
    const msg = createMessage(5, 6);
    const key = store.buildMessageKey(msg);

    await store.enqueueRetry({
      messageKey: key,
      updateId: 200,
      msg,
      content: "hello",
      error: "write failed",
    });
    assert.equal(state.retry_queue.length, 1);

    await store.markProcessed(key, 201);

    assert.equal(state.retry_queue.length, 0);
    assert.equal(state.last_processed_update_id, 201);
  });

  test("updates existing retry item instead of duplicating it", async () => {
    const { state, store } = createStore();
    const msg = createMessage(7, 8);
    const key = store.buildMessageKey(msg);

    await store.enqueueRetry({
      messageKey: key,
      updateId: 1,
      msg,
      content: "a",
      error: "error A",
    });
    await store.enqueueRetry({
      messageKey: key,
      updateId: 1,
      msg,
      content: "b",
      error: "error B",
    });

    assert.equal(state.retry_queue.length, 1);
    assert.equal(state.retry_queue[0].last_error, "error B");
    assert.equal(state.retry_queue[0].content, "a");
  });

  test("returns ready retries by timestamp filter", async () => {
    const { store } = createStore();
    const msgA = createMessage(1, 1);
    const msgB = createMessage(1, 2);

    await store.enqueueRetry({
      messageKey: store.buildMessageKey(msgA),
      msg: msgA,
      content: "a",
      error: "error",
    });
    await store.enqueueRetry({
      messageKey: store.buildMessageKey(msgB),
      msg: msgB,
      content: "b",
      error: "error",
    });

    const future = Date.now() + 2 * 60_000;
    const ready = store.getReadyRetries(future);
    assert.equal(ready.length, 2);
  });

  test("caps processed key history at configured size", async () => {
    const { state, store } = createStore();

    for (let i = 0; i < 5_010; i += 1) {
      await store.markProcessed(`1:${i}`);
    }

    assert.equal(state.processed_message_keys.length, 5_000);
    assert.equal(state.processed_message_keys[0], "1:10");
    assert.equal(state.processed_message_keys[4_999], "1:5009");
  });
});
