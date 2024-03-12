/*
 * 直接拉了mitt的源码作为我们的 eventBus 来使用;
 */

export type EventType = string | symbol;

// An event handler can take an optional event argument
// and should not return a value
export type Handler<T = unknown> = (event: T) => void;
export type WildcardHandler<T = Record<string, unknown>> = (type: keyof T, event: T[keyof T]) => void;

// An array of all currently registered event handlers for a type
export type EventHandlerList<T = unknown> = Array<Handler<T>>;
export type WildCardEventHandlerList<T = Record<string, unknown>> = Array<WildcardHandler<T>>;

// A map of event types and their corresponding event handlers.
export type EventHandlerMap<Events extends Record<EventType, unknown>> = Map<
    keyof Events | "*",
    EventHandlerList<Events[keyof Events]> | WildCardEventHandlerList<Events>
>;

export interface Emitter<Events extends Record<EventType, unknown>> {
    /**
     * A Map of event names to registered handler functions.
     * 一个 EventHandlerMap 类型的对象，EventHandlerMap 是一个事件类型和它们对应的事件处理函数的映射表
     */
    all: EventHandlerMap<Events>;

    /**
     * Register an event handler for the given type.
     * @param {string|symbol} type Type of event to listen for, or `'*'` for all events
     * @param {Function} handler Function to call in response to given event
     * @memberOf eventBus
     */
    on<Key extends keyof Events>(type: Key, handler: Handler<Events[Key]>): void;

    /**
     * Register an event handler for the given type.
     * @param {string|symbol} type Type of event to listen for, or `'*'` for all events
     * @param {Function} handler Function to call in response to given event
     * @memberOf eventBus
     */
    on(type: "*", handler: WildcardHandler<Events>): void;

    /**
     * Remove an event handler for the given type.
     * If `handler` is omitted, all handlers of the given type are removed.
     * @param {string|symbol} type Type of event to unregister `handler` from (`'*'` to remove a wildcard handler)
     * @param {Function} [handler] Handler function to remove
     * @memberOf eventBus
     */
    off<Key extends keyof Events>(type: Key, handler?: Handler<Events[Key]>): void;

    /**
     * Remove an event handler for the given type.
     * If `handler` is omitted, all handlers of the given type are removed.
     * @param {string|symbol} type Type of event to unregister `handler` from (`'*'` to remove a wildcard handler)
     * @param {Function} [handler] Handler function to remove
     * @memberOf eventBus
     */
    off(type: "*", handler: WildcardHandler<Events>): void;

    /**
     * Invoke all handlers for the given type.
     * If present, `'*'` handlers are invoked after type-matched handlers.
     *
     * Note: Manually firing '*' handlers is not supported.
     *
     * @param {string|symbol} type The event type to invoke
     * @param {Any} [evt] Any value (object is recommended and powerful), passed to each handler
     * @memberOf eventBus
     */
    emit<Key extends keyof Events>(type: Key, event: Events[Key]): void;

    /**
     * Invoke all handlers for the given type.
     * If present, `'*'` handlers are invoked after type-matched handlers.
     *
     * Note: Manually firing '*' handlers is not supported.
     *
     * @param {string|symbol} type The event type to invoke
     * @param {Any} [evt] Any value (object is recommended and powerful), passed to each handler
     * @memberOf eventBus
     */
    emit<Key extends keyof Events>(type: undefined extends Events[Key] ? Key : never): void;
}

/**
 * eventBus: Tiny (~200b) functional event emitter / pubsub.
 * @name eventBus
 * @returns {eventBus}
 */
export default function mitt<Events extends Record<EventType, unknown>>(
    all?: EventHandlerMap<Events>
): Emitter<Events> {
    type GenericEventHandler = Handler<Events[keyof Events]> | WildcardHandler<Events>;
    all = all || new Map();

    return {
        /**
         * A Map of event names to registered handler functions.
         */
        all,

        /**
         * Register an event handler for the given type.
         * @param {string|symbol} type Type of event to listen for, or `'*'` for all events
         * @param {Function} handler Function to call in response to given event
         * @memberOf eventBus
         */
        on<Key extends keyof Events>(type: Key, handler: GenericEventHandler) {
            const handlers: Array<GenericEventHandler> | undefined = all!.get(type);
            if (handlers) {
                handlers.push(handler);
            } else {
                all!.set(type, [handler] as EventHandlerList<Events[keyof Events]>);
            }
        },

        /**
         * Remove an event handler for the given type.
         * If `handler` is omitted, all handlers of the given type are removed.
         * @param {string|symbol} type Type of event to unregister `handler` from (`'*'` to remove a wildcard handler)
         * @param {Function} [handler] Handler function to remove
         * @memberOf eventBus
         */
        off<Key extends keyof Events>(type: Key, handler?: GenericEventHandler) {
            const handlers: Array<GenericEventHandler> | undefined = all!.get(type);
            if (handlers) {
                if (handler) {
                    handlers.splice(handlers.indexOf(handler) >>> 0, 1);
                } else {
                    all!.set(type, []);
                }
            }
        },

        /**
         * Invoke all handlers for the given type.
         * If present, `'*'` handlers are invoked after type-matched handlers.
         *
         * Note: Manually firing '*' handlers is not supported.
         *
         * @param {string|symbol} type The event type to invoke
         * @param {Any} [evt] Any value (object is recommended and powerful), passed to each handler
         * @memberOf eventBus
         */
        emit<Key extends keyof Events>(type: Key, evt?: Events[Key]) {
            let handlers = all!.get(type);
            if (handlers) {
                (handlers as EventHandlerList<Events[keyof Events]>).slice().map((handler) => {
                    handler(evt!);
                });
            }

            handlers = all!.get("*");
            if (handlers) {
                (handlers as WildCardEventHandlerList<Events>).slice().map((handler) => {
                    handler(type, evt!);
                });
            }
        },
    };
}

const emitter = mitt();
export { emitter };
