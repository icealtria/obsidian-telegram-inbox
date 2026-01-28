# Refactor Progress

## Status
- [x] Read all modules
- [ ] Code structure optimization
- [ ] Extensibility improvements
- [ ] Maintainability improvements
- [ ] Performance optimization

## Modules
- [ ] `src/main.ts`
- [ ] `src/bot.ts`
- [ ] `src/io.ts`
- [ ] `src/settings.ts`
- [ ] `src/type.ts`
- [ ] `src/utils/diary.ts`
- [ ] `src/utils/download.ts`
- [ ] `src/utils/file.ts`
- [ ] `src/utils/markdown.ts`
- [ ] `src/utils/sync.ts`
- [ ] `src/utils/template.ts`

## Refactor Points
1. **Code Structure & Responsibility**:
   - `TelegramBot` in `bot.ts` is a "God Class" handling too many things: middleware creation, command registration, message processing, and media downloading.
   - `src/settings.ts` mixes UI code (`PluginSettingTab`) with data structures (`TGInboxSettings`).
   - `src/utils/template.ts` contains complex data building logic that could be better structured.
2. **Extensibility**:
   - Bot commands are hardcoded in `TelegramBot`. A command registry or dispatcher would allow for easier addition of new commands.
   - Message processing (text vs media) is handled with large `if/else` or separate `bot.on` calls. A pipeline or handler-based approach could be more flexible.
3. **Maintainability**:
   - Error handling is repetitive and inconsistently logged/notified to the user.
   - Extensive use of `any` in `src/utils/sync.ts` reduces type safety.
   - Logic for determining the save path is split across `src/utils/file.ts` and `src/utils/diary.ts`.
4. **Performance**:
   - `setInterval` in settings tab for bot status.
   - Ensure `async-mutex` doesn't cause unnecessary delays for independent operations if multiple bots/accounts were ever supported (not currently a concern but good to keep in mind).

## Completed
- (None)