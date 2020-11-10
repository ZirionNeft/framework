"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SapphireClient = void 0;
const discord_js_1 = require("discord.js");
const path_1 = require("path");
const PluginManager_1 = require("./plugins/PluginManager");
const ArgumentStore_1 = require("./structures/ArgumentStore");
const CommandStore_1 = require("./structures/CommandStore");
const EventStore_1 = require("./structures/EventStore");
const PreconditionStore_1 = require("./structures/PreconditionStore");
require("./types/Enums");
const Events_1 = require("./types/Events");
const Internationalization_1 = require("./utils/i18n/Internationalization");
require("./utils/logger/ILogger");
const Logger_1 = require("./utils/logger/Logger");
const RootDir_1 = require("./utils/RootDir");
// Extensions
require("./extensions/SapphireMessage");
/**
 * The base [[Client]] extension that makes Sapphire work. When building a Discord bot with the framework, the developer
 * must either use this class, or extend it.
 *
 * Sapphire also automatically detects the folders to scan for pieces, please read
 * [[SapphireClient.registerUserDirectories]] for reference. This method is called at the start of the
 * [[SapphireClient.login]] method.
 *
 * @since 1.0.0
 * @example
 * ```typescript
 * const client = new SapphireClient({
 *   presence: {
 *     activity: {
 *       name: 'for commands!',
 *       type: 'LISTENING'
 *     }
 *   }
 * });
 *
 * client.login(process.env.DISCORD_TOKEN)
 *   .catch(console.error);
 * ```
 *
 * @example
 * ```typescript
 * // Automatically scan from a specific directory, e.g. the main
 * // file is at `/home/me/bot/index.js` and all your pieces are at
 * // `/home/me/bot/pieces` (e.g. `/home/me/bot/pieces/commands/MyCommand.js`):
 * const client = new SapphireClient({
 *   baseUserDirectory: join(__dirname, 'pieces'),
 *   // More options...
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Opt-out automatic scanning:
 * const client = new SapphireClient({
 *   baseUserDirectory: null,
 *   // More options...
 * });
 * ```
 */
class SapphireClient extends discord_js_1.Client {
    constructor(options = {}) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
        super(options);
        /**
         * The client's ID, used for the user prefix.
         * @since 1.0.0
         */
        this.id = null;
        for (const plugin of SapphireClient.plugins.values("preGenericsInitialization" /* PreGenericsInitialization */)) {
            plugin.hook.call(this, options);
            this.emit(Events_1.Events.PluginLoaded, plugin.type, plugin.name);
        }
        this.logger = (_b = (_a = options.logger) === null || _a === void 0 ? void 0 : _a.instance) !== null && _b !== void 0 ? _b : new Logger_1.Logger((_d = (_c = options.logger) === null || _c === void 0 ? void 0 : _c.level) !== null && _d !== void 0 ? _d : 30 /* Info */);
        this.i18n = (_f = (_e = options.i18n) === null || _e === void 0 ? void 0 : _e.instance) !== null && _f !== void 0 ? _f : new Internationalization_1.Internationalization((_h = (_g = options.i18n) === null || _g === void 0 ? void 0 : _g.defaultName) !== null && _h !== void 0 ? _h : 'en-US');
        this.fetchPrefix = (_j = options.fetchPrefix) !== null && _j !== void 0 ? _j : (() => { var _a; return (_a = this.options.defaultPrefix) !== null && _a !== void 0 ? _a : null; });
        for (const plugin of SapphireClient.plugins.values("preInitialization" /* PreInitialization */)) {
            plugin.hook.call(this, options);
            this.emit(Events_1.Events.PluginLoaded, plugin.type, plugin.name);
        }
        this.id = (_k = options.id) !== null && _k !== void 0 ? _k : null;
        this.arguments = new ArgumentStore_1.ArgumentStore(this).registerPath(path_1.join(__dirname, '..', 'arguments'));
        this.commands = new CommandStore_1.CommandStore(this);
        this.events = new EventStore_1.EventStore(this).registerPath(path_1.join(__dirname, '..', 'events'));
        this.preconditions = new PreconditionStore_1.PreconditionStore(this).registerPath(path_1.join(__dirname, '..', 'preconditions'));
        this.stores = new Set();
        this.registerStore(this.arguments) //
            .registerStore(this.commands)
            .registerStore(this.events)
            .registerStore(this.preconditions);
        for (const plugin of SapphireClient.plugins.values("postInitialization" /* PostInitialization */)) {
            plugin.hook.call(this, options);
            this.emit(Events_1.Events.PluginLoaded, plugin.type, plugin.name);
        }
    }
    /**
     * Registers all user directories from the process working directory, the default value is obtained by assuming
     * CommonJS (high accuracy) but with fallback for ECMAScript Modules (reads package.json's `main` entry, fallbacks
     * to `process.cwd()`).
     *
     * By default, if you have this folder structure:
     * ```
     * /home/me/my-bot
     * ├─ src
     * │  ├─ commands
     * │  ├─ events
     * │  └─ main.js
     * └─ package.json
     * ```
     *
     * And you run `node src/main.js`, the directories `/home/me/my-bot/src/commands` and `/home/me/my-bot/src/events` will
     * be registered for the commands and events stores respectively, since both directories are located in the same
     * directory as your main file.
     *
     * **Note**: this also registers directories for all other stores, even if they don't have a folder, this allows you
     * to create new pieces and hot-load them later anytime.
     * @param rootDirectory The root directory to register pieces at.
     */
    registerUserDirectories(rootDirectory = RootDir_1.getRootDirectory()) {
        for (const store of this.stores) {
            store.registerPath(path_1.join(rootDirectory, store.name));
        }
    }
    /**
     * Registers a store.
     * @param store The store to register.
     */
    registerStore(store) {
        this.stores.add(store);
        return this;
    }
    /**
     * Loads all pieces, then logs the client in, establishing a websocket connection to Discord.
     * @since 1.0.0
     * @param token Token of the account to log in with.
     * @retrun Token of the account used.
     */
    async login(token) {
        // Register the user directory if not null:
        if (this.options.baseUserDirectory !== null) {
            this.registerUserDirectories(this.options.baseUserDirectory);
        }
        // Call pre-login plugins:
        for (const plugin of SapphireClient.plugins.values("preLogin" /* PreLogin */)) {
            await plugin.hook.call(this, this.options);
            this.emit(Events_1.Events.PluginLoaded, plugin.type, plugin.name);
        }
        // Loads all stores, then call login:
        await Promise.all([...this.stores].map((store) => store.loadAll()));
        const login = await super.login(token);
        // Call post-login plugins:
        for (const plugin of SapphireClient.plugins.values("postLogin" /* PostLogin */)) {
            await plugin.hook.call(this, this.options);
            this.emit(Events_1.Events.PluginLoaded, plugin.type, plugin.name);
        }
        return login;
    }
    static use(plugin) {
        this.plugins.use(plugin);
        return this;
    }
}
exports.SapphireClient = SapphireClient;
SapphireClient.plugins = new PluginManager_1.PluginManager();
//# sourceMappingURL=SapphireClient.js.map