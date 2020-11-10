"use strict";
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, privateMap, value) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to set private field on non-instance");
    }
    privateMap.set(receiver, value);
    return value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, privateMap) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to get private field on non-instance");
    }
    return privateMap.get(receiver);
};
var _listener;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Event = void 0;
const Events_1 = require("../types/Events");
const BasePiece_1 = require("./base/BasePiece");
/**
 * The base event class. This class is abstract and is to be extended by subclasses, which should implement the methods. In
 * Sapphire's workflow, events are called when the emitter they listen on emits a new message with the same event name.
 *
 * @example
 * ```typescript
 * // TypeScript:
 * import { Event, Events, PieceContext } from 'sapphire/framework';
 *
 * // Define a class extending `CoreEvent`, then export it.
 * // NOTE: You can use `export default` or `export =` too.
 * export class CoreEvent extends Event<Events.Ready> {
 *   public constructor(context: PieceContext) {
 *     super(context, { event: Events.Ready, once: true });
 *   }
 *
 *   public run() {
 *     if (!this.client.id) this.client.id = this.client.user?.id ?? null;
 *   }
 * }
 * ```
 *
 * @example
 * ```javascript
 * // JavaScript:
 * const { Event, Events } = require('sapphire/framework');
 *
 * // Define a class extending `CoreEvent`, then export it.
 * module.exports = class CoreEvent extends Event {
 *   constructor(context) {
 *     super(context, { event: Events.Ready, once: true });
 *   }
 *
 *   run() {
 *     if (!this.client.id) this.client.id = this.client.user?.id ?? null;
 *   }
 * }
 * ```
 */
class Event extends BasePiece_1.BasePiece {
    constructor(context, options = {}) {
        var _a, _b, _c;
        super(context, options);
        // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
        _listener.set(this, void 0);
        this.emitter =
            typeof options.emitter === 'undefined'
                ? this.client
                : (_a = (typeof options.emitter === 'string' ? Reflect.get(this.client, options.emitter) : options.emitter)) !== null && _a !== void 0 ? _a : null;
        this.event = (_b = options.event) !== null && _b !== void 0 ? _b : this.name;
        this.once = (_c = options.once) !== null && _c !== void 0 ? _c : false;
        __classPrivateFieldSet(this, _listener, this.emitter && this.event ? (this.once ? this._runOnce.bind(this) : this._run.bind(this)) : null);
    }
    onLoad() {
        if (__classPrivateFieldGet(this, _listener))
            this.emitter[this.once ? 'once' : 'on'](this.event, __classPrivateFieldGet(this, _listener));
    }
    onUnload() {
        if (!this.once && __classPrivateFieldGet(this, _listener))
            this.emitter.off(this.event, __classPrivateFieldGet(this, _listener));
    }
    toJSON() {
        return {
            ...super.toJSON(),
            event: this.event
        };
    }
    async _run(...args) {
        try {
            // @ts-expect-error Argument of type 'unknown[]' is not assignable to parameter of type 'E extends string | number ? ClientEvents[E] : unknown[]'. (2345)
            await this.run(...args);
        }
        catch (error) {
            this.client.emit(Events_1.Events.EventError, error, { piece: this });
        }
    }
    async _runOnce(...args) {
        await this._run(...args);
        await this.store.unload(this);
    }
}
exports.Event = Event;
_listener = new WeakMap();
//# sourceMappingURL=Event.js.map