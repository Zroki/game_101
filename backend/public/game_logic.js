
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
(function (io) {
    'use strict';

    function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

    var io__default = /*#__PURE__*/_interopDefaultLegacy(io);

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function get_store_value(store) {
        let value;
        subscribe(store, _ => value = _)();
        return value;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function set_store_value(store, ret, value = ret) {
        store.set(value);
        return ret;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    function destroy_block(block, lookup) {
        block.d(1);
        lookup.delete(block.key);
    }
    function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                block.p(child_ctx, dirty);
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next);
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        return new_blocks;
    }
    function validate_each_keys(ctx, list, get_context, get_key) {
        const keys = new Set();
        for (let i = 0; i < list.length; i++) {
            const key = get_key(get_context(ctx, list, i));
            if (keys.has(key)) {
                throw new Error(`Cannot have duplicate keys in a keyed each`);
            }
            keys.add(key);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.29.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev("SvelteDOMSetProperty", { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    class Player {
        constructor(name) {
            this.name = name;
            this.score = 0;
            this.cards = [
                {
                    card: 'T',
                    value: 11,
                },
                {
                    card: 'K',
                    value: 4,
                },
                {
                    card: 'D',
                    value: 3,
                },
                {
                    card: 'J',
                    value: 2,
                },
                {
                    card: '10',
                    value: 10,
                },
                {
                    card: '8',
                    value: 8,
                },
                {
                    card: '7',
                    value: 7,
                },
                {
                    card: '6',
                    value: 6,
                },
            ];
        }
        addScore(score) {
            if (this.score + Number(score) === 101) {
                this.score = 0;
                return 0;
            } else {
                this.score += Number(score);
                return this.score;
            }
        }
        resetScore() {
            this.score = 0;
            return 0;
        }
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    let players = writable([]);
    let turns = writable([]);
    let lastTurn = writable({});

    /* src/UI/singlePlayer/StartMenu.svelte generated by Svelte v3.29.0 */
    const file = "src/UI/singlePlayer/StartMenu.svelte";

    function add_css() {
    	var style = element("style");
    	style.id = "svelte-1nwwoem-style";
    	style.textContent = ".start_main.svelte-1nwwoem.svelte-1nwwoem{margin:0 auto;width:25%;text-align:center}.start_adding_new_players.svelte-1nwwoem.svelte-1nwwoem{border:1px solid #00000014;border-radius:5px;background-color:#f1f1f196;padding:10px}.start_adding_new_players.svelte-1nwwoem h2.svelte-1nwwoem{margin:5px 0}.start_adding_new_players.svelte-1nwwoem button.svelte-1nwwoem,.start_new_game.svelte-1nwwoem button.svelte-1nwwoem{margin:5px 0;background-color:#007eff;border:1px solid #0400ffb0;padding:5px 10px;color:white;font-weight:bold;border-radius:5px;font-style:italic;cursor:pointer;transition:0.4s}.start_adding_new_players.svelte-1nwwoem button.svelte-1nwwoem:hover,.start_new_game.svelte-1nwwoem button.svelte-1nwwoem:hover{background-color:#0014ff;transition:0.4s}.start_adding_new_players.svelte-1nwwoem input.svelte-1nwwoem{box-sizing:border-box;margin:5px auto;font-family:inherit;overflow:visible;display:block;color:#495057;background-color:#fff;background-clip:padding-box;border:1px solid #ced4da;transition:border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;padding:0.25rem 0.5rem;font-size:0.875rem;line-height:1.5;border-radius:0.2rem;position:relative;flex:1 1 auto;width:100%}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU3RhcnRNZW51LnN2ZWx0ZSIsInNvdXJjZXMiOlsiU3RhcnRNZW51LnN2ZWx0ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8c2NyaXB0PlxyXG4gICAgaW1wb3J0IHtjcmVhdGVFdmVudERpc3BhdGNoZXJ9IGZyb20gXCJzdmVsdGVcIjtcclxuICAgIGltcG9ydCBQbGF5ZXIgZnJvbSAnLi4vLi4vY2xhc3Nlcy9QbGF5ZXIuanMnO1xyXG4gICAgaW1wb3J0IHtwbGF5ZXJzfSBmcm9tIFwiLi4vLi4vc3RvcmVcIjtcclxuXHJcbiAgICBjb25zdCBkaXNwYXRjaCA9IGNyZWF0ZUV2ZW50RGlzcGF0Y2hlcigpO1xyXG5cclxuICAgIGxldCBwbGF5ZXJOYW1lID0gXCJcIjtcclxuXHJcbiAgICBjbGFzcyBHYW1lIHtcclxuICAgICAgICBzdGF0aWMgYWRkTmV3UGxheWVyKCkge1xyXG4gICAgICAgICAgICBpZiAocGxheWVyTmFtZSAhPT0gXCJcIikge1xyXG4gICAgICAgICAgICAgICAgJHBsYXllcnMgPSBbLi4uJHBsYXllcnMsIG5ldyBQbGF5ZXIocGxheWVyTmFtZSldO1xyXG4gICAgICAgICAgICAgICAgcGxheWVyTmFtZSA9IFwiXCI7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHN0YXRpYyBzdGFydE5ld0dhbWUoKSB7XHJcbiAgICAgICAgICAgIGlmICgkcGxheWVycy5sZW5ndGggPj0gMikge1xyXG4gICAgICAgICAgICAgICAgZGlzcGF0Y2goXCJzdGFydFwiKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuPC9zY3JpcHQ+XHJcblxyXG48c3R5bGU+XHJcbiAgICAuc3RhcnRfbWFpbiB7XHJcbiAgICAgICAgbWFyZ2luOiAwIGF1dG87XHJcbiAgICAgICAgd2lkdGg6IDI1JTtcclxuICAgICAgICB0ZXh0LWFsaWduOiBjZW50ZXI7XHJcbiAgICB9XHJcblxyXG4gICAgLnN0YXJ0X2FkZGluZ19uZXdfcGxheWVycyB7XHJcbiAgICAgICAgYm9yZGVyOiAxcHggc29saWQgIzAwMDAwMDE0O1xyXG4gICAgICAgIGJvcmRlci1yYWRpdXM6IDVweDtcclxuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjZjFmMWYxOTY7XHJcbiAgICAgICAgcGFkZGluZzogMTBweDtcclxuICAgIH1cclxuXHJcbiAgICAuc3RhcnRfYWRkaW5nX25ld19wbGF5ZXJzIGgyIHtcclxuICAgICAgICBtYXJnaW46IDVweCAwO1xyXG4gICAgfVxyXG5cclxuICAgIC5zdGFydF9hZGRpbmdfbmV3X3BsYXllcnMgYnV0dG9uLFxyXG4gICAgLnN0YXJ0X25ld19nYW1lIGJ1dHRvbiB7XHJcbiAgICAgICAgbWFyZ2luOiA1cHggMDtcclxuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjMDA3ZWZmO1xyXG4gICAgICAgIGJvcmRlcjogMXB4IHNvbGlkICMwNDAwZmZiMDtcclxuICAgICAgICBwYWRkaW5nOiA1cHggMTBweDtcclxuICAgICAgICBjb2xvcjogd2hpdGU7XHJcbiAgICAgICAgZm9udC13ZWlnaHQ6IGJvbGQ7XHJcbiAgICAgICAgYm9yZGVyLXJhZGl1czogNXB4O1xyXG4gICAgICAgIGZvbnQtc3R5bGU6IGl0YWxpYztcclxuICAgICAgICBjdXJzb3I6IHBvaW50ZXI7XHJcbiAgICAgICAgdHJhbnNpdGlvbjogMC40cztcclxuICAgIH1cclxuXHJcbiAgICAuc3RhcnRfYWRkaW5nX25ld19wbGF5ZXJzIGJ1dHRvbjpob3ZlcixcclxuICAgIC5zdGFydF9uZXdfZ2FtZSBidXR0b246aG92ZXIge1xyXG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6ICMwMDE0ZmY7XHJcbiAgICAgICAgdHJhbnNpdGlvbjogMC40cztcclxuICAgIH1cclxuXHJcbiAgICAuc3RhcnRfYWRkaW5nX25ld19wbGF5ZXJzIGlucHV0IHtcclxuICAgICAgICBib3gtc2l6aW5nOiBib3JkZXItYm94O1xyXG4gICAgICAgIG1hcmdpbjogNXB4IGF1dG87XHJcbiAgICAgICAgZm9udC1mYW1pbHk6IGluaGVyaXQ7XHJcbiAgICAgICAgb3ZlcmZsb3c6IHZpc2libGU7XHJcbiAgICAgICAgZGlzcGxheTogYmxvY2s7XHJcbiAgICAgICAgY29sb3I6ICM0OTUwNTc7XHJcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogI2ZmZjtcclxuICAgICAgICBiYWNrZ3JvdW5kLWNsaXA6IHBhZGRpbmctYm94O1xyXG4gICAgICAgIGJvcmRlcjogMXB4IHNvbGlkICNjZWQ0ZGE7XHJcbiAgICAgICAgdHJhbnNpdGlvbjogYm9yZGVyLWNvbG9yIDAuMTVzIGVhc2UtaW4tb3V0LCBib3gtc2hhZG93IDAuMTVzIGVhc2UtaW4tb3V0O1xyXG4gICAgICAgIHBhZGRpbmc6IDAuMjVyZW0gMC41cmVtO1xyXG4gICAgICAgIGZvbnQtc2l6ZTogMC44NzVyZW07XHJcbiAgICAgICAgbGluZS1oZWlnaHQ6IDEuNTtcclxuICAgICAgICBib3JkZXItcmFkaXVzOiAwLjJyZW07XHJcbiAgICAgICAgcG9zaXRpb246IHJlbGF0aXZlO1xyXG4gICAgICAgIGZsZXg6IDEgMSBhdXRvO1xyXG4gICAgICAgIHdpZHRoOiAxMDAlO1xyXG4gICAgfVxyXG48L3N0eWxlPlxyXG5cclxuPGRpdiBjbGFzcz1cInN0YXJ0X21haW5cIj5cclxuICAgIDxkaXYgY2xhc3M9XCJzdGFydF9hZGRpbmdfbmV3X3BsYXllcnNcIj5cclxuICAgICAgICA8aDI+0JLQstC10LTQuNGC0LUg0LjQvNGPINC40LPRgNC+0LrQsDwvaDI+XHJcbiAgICAgICAgPGxhYmVsIGZvcj1cInBsYXllcl9uYW1lXCI+XHJcbiAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwidGV4dFwiIGlkPVwicGxheWVyX25hbWVcIiBiaW5kOnZhbHVlPXtwbGF5ZXJOYW1lfS8+XHJcbiAgICAgICAgPC9sYWJlbD5cclxuICAgICAgICA8YnV0dG9uIG9uOmNsaWNrPXtHYW1lLmFkZE5ld1BsYXllcn0+0JTQvtCx0LDQstC40YLRjCDQuNCz0YDQvtC60LA8L2J1dHRvbj5cclxuICAgIDwvZGl2PlxyXG4gICAgPGRpdiBjbGFzcz1cImxpc3RfcGxheWVyc1wiPlxyXG4gICAgICAgIHsjaWYgJHBsYXllcnMubGVuZ3RoICE9PSAwfVxyXG4gICAgICAgICAgICA8aDI+0JTQvtCx0LDQstC70LXQvdC90YvQtSDQuNCz0YDQvtC60Lg8L2gyPlxyXG4gICAgICAgIHsvaWZ9XHJcbiAgICAgICAgeyNlYWNoICRwbGF5ZXJzIGFzIHBsYXllciwgaW5kZXggKHBsYXllcil9XHJcbiAgICAgICAgICAgIDxwPntwbGF5ZXIubmFtZX08L3A+XHJcbiAgICAgICAgey9lYWNofVxyXG4gICAgPC9kaXY+XHJcbiAgICA8ZGl2IGNsYXNzPVwic3RhcnRfbmV3X2dhbWVcIj5cclxuICAgICAgICA8YnV0dG9uIG9uOmNsaWNrPXtHYW1lLnN0YXJ0TmV3R2FtZX0+0J3QvtCy0LDRjyDQuNCz0YDQsDwvYnV0dG9uPlxyXG4gICAgPC9kaXY+XHJcbjwvZGl2PlxyXG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBMEJJLFdBQVcsOEJBQUMsQ0FBQyxBQUNULE1BQU0sQ0FBRSxDQUFDLENBQUMsSUFBSSxDQUNkLEtBQUssQ0FBRSxHQUFHLENBQ1YsVUFBVSxDQUFFLE1BQU0sQUFDdEIsQ0FBQyxBQUVELHlCQUF5Qiw4QkFBQyxDQUFDLEFBQ3ZCLE1BQU0sQ0FBRSxHQUFHLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FDM0IsYUFBYSxDQUFFLEdBQUcsQ0FDbEIsZ0JBQWdCLENBQUUsU0FBUyxDQUMzQixPQUFPLENBQUUsSUFBSSxBQUNqQixDQUFDLEFBRUQsd0NBQXlCLENBQUMsRUFBRSxlQUFDLENBQUMsQUFDMUIsTUFBTSxDQUFFLEdBQUcsQ0FBQyxDQUFDLEFBQ2pCLENBQUMsQUFFRCx3Q0FBeUIsQ0FBQyxxQkFBTSxDQUNoQyw4QkFBZSxDQUFDLE1BQU0sZUFBQyxDQUFDLEFBQ3BCLE1BQU0sQ0FBRSxHQUFHLENBQUMsQ0FBQyxDQUNiLGdCQUFnQixDQUFFLE9BQU8sQ0FDekIsTUFBTSxDQUFFLEdBQUcsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUMzQixPQUFPLENBQUUsR0FBRyxDQUFDLElBQUksQ0FDakIsS0FBSyxDQUFFLEtBQUssQ0FDWixXQUFXLENBQUUsSUFBSSxDQUNqQixhQUFhLENBQUUsR0FBRyxDQUNsQixVQUFVLENBQUUsTUFBTSxDQUNsQixNQUFNLENBQUUsT0FBTyxDQUNmLFVBQVUsQ0FBRSxJQUFJLEFBQ3BCLENBQUMsQUFFRCx3Q0FBeUIsQ0FBQyxxQkFBTSxNQUFNLENBQ3RDLDhCQUFlLENBQUMscUJBQU0sTUFBTSxBQUFDLENBQUMsQUFDMUIsZ0JBQWdCLENBQUUsT0FBTyxDQUN6QixVQUFVLENBQUUsSUFBSSxBQUNwQixDQUFDLEFBRUQsd0NBQXlCLENBQUMsS0FBSyxlQUFDLENBQUMsQUFDN0IsVUFBVSxDQUFFLFVBQVUsQ0FDdEIsTUFBTSxDQUFFLEdBQUcsQ0FBQyxJQUFJLENBQ2hCLFdBQVcsQ0FBRSxPQUFPLENBQ3BCLFFBQVEsQ0FBRSxPQUFPLENBQ2pCLE9BQU8sQ0FBRSxLQUFLLENBQ2QsS0FBSyxDQUFFLE9BQU8sQ0FDZCxnQkFBZ0IsQ0FBRSxJQUFJLENBQ3RCLGVBQWUsQ0FBRSxXQUFXLENBQzVCLE1BQU0sQ0FBRSxHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FDekIsVUFBVSxDQUFFLFlBQVksQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQ3hFLE9BQU8sQ0FBRSxPQUFPLENBQUMsTUFBTSxDQUN2QixTQUFTLENBQUUsUUFBUSxDQUNuQixXQUFXLENBQUUsR0FBRyxDQUNoQixhQUFhLENBQUUsTUFBTSxDQUNyQixRQUFRLENBQUUsUUFBUSxDQUNsQixJQUFJLENBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQ2QsS0FBSyxDQUFFLElBQUksQUFDZixDQUFDIn0= */";
    	append_dev(document.head, style);
    }

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	child_ctx[7] = i;
    	return child_ctx;
    }

    // (94:8) {#if $players.length !== 0}
    function create_if_block(ctx) {
    	let h2;

    	const block = {
    		c: function create() {
    			h2 = element("h2");
    			h2.textContent = "Добавленные игроки";
    			add_location(h2, file, 94, 12, 2494);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h2, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(94:8) {#if $players.length !== 0}",
    		ctx
    	});

    	return block;
    }

    // (97:8) {#each $players as player, index (player)}
    function create_each_block(key_1, ctx) {
    	let p;
    	let t_value = /*player*/ ctx[5].name + "";
    	let t;

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			p = element("p");
    			t = text(t_value);
    			add_location(p, file, 97, 12, 2602);
    			this.first = p;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$players*/ 2 && t_value !== (t_value = /*player*/ ctx[5].name + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(97:8) {#each $players as player, index (player)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let div3;
    	let div0;
    	let h2;
    	let t1;
    	let label;
    	let input;
    	let t2;
    	let button0;
    	let t4;
    	let div1;
    	let t5;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let t6;
    	let div2;
    	let button1;
    	let mounted;
    	let dispose;
    	let if_block = /*$players*/ ctx[1].length !== 0 && create_if_block(ctx);
    	let each_value = /*$players*/ ctx[1];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*player*/ ctx[5];
    	validate_each_keys(ctx, each_value, get_each_context, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div0 = element("div");
    			h2 = element("h2");
    			h2.textContent = "Введите имя игрока";
    			t1 = space();
    			label = element("label");
    			input = element("input");
    			t2 = space();
    			button0 = element("button");
    			button0.textContent = "Добавить игрока";
    			t4 = space();
    			div1 = element("div");
    			if (if_block) if_block.c();
    			t5 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t6 = space();
    			div2 = element("div");
    			button1 = element("button");
    			button1.textContent = "Новая игра";
    			attr_dev(h2, "class", "svelte-1nwwoem");
    			add_location(h2, file, 86, 8, 2173);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "id", "player_name");
    			attr_dev(input, "class", "svelte-1nwwoem");
    			add_location(input, file, 88, 12, 2249);
    			attr_dev(label, "for", "player_name");
    			add_location(label, file, 87, 8, 2210);
    			attr_dev(button0, "class", "svelte-1nwwoem");
    			add_location(button0, file, 90, 8, 2338);
    			attr_dev(div0, "class", "start_adding_new_players svelte-1nwwoem");
    			add_location(div0, file, 85, 4, 2125);
    			attr_dev(div1, "class", "list_players");
    			add_location(div1, file, 92, 4, 2417);
    			attr_dev(button1, "class", "svelte-1nwwoem");
    			add_location(button1, file, 101, 8, 2695);
    			attr_dev(div2, "class", "start_new_game svelte-1nwwoem");
    			add_location(div2, file, 100, 4, 2657);
    			attr_dev(div3, "class", "start_main svelte-1nwwoem");
    			add_location(div3, file, 84, 0, 2095);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div0);
    			append_dev(div0, h2);
    			append_dev(div0, t1);
    			append_dev(div0, label);
    			append_dev(label, input);
    			set_input_value(input, /*playerName*/ ctx[0]);
    			append_dev(div0, t2);
    			append_dev(div0, button0);
    			append_dev(div3, t4);
    			append_dev(div3, div1);
    			if (if_block) if_block.m(div1, null);
    			append_dev(div1, t5);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			append_dev(div3, t6);
    			append_dev(div3, div2);
    			append_dev(div2, button1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[3]),
    					listen_dev(button0, "click", /*Game*/ ctx[2].addNewPlayer, false, false, false),
    					listen_dev(button1, "click", /*Game*/ ctx[2].startNewGame, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*playerName*/ 1 && input.value !== /*playerName*/ ctx[0]) {
    				set_input_value(input, /*playerName*/ ctx[0]);
    			}

    			if (/*$players*/ ctx[1].length !== 0) {
    				if (if_block) ; else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					if_block.m(div1, t5);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*$players*/ 2) {
    				const each_value = /*$players*/ ctx[1];
    				validate_each_argument(each_value);
    				validate_each_keys(ctx, each_value, get_each_context, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, div1, destroy_block, create_each_block, null, get_each_context);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			if (if_block) if_block.d();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}

    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let $players;
    	validate_store(players, "players");
    	component_subscribe($$self, players, $$value => $$invalidate(1, $players = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("StartMenu", slots, []);
    	const dispatch = createEventDispatcher();
    	let playerName = "";

    	class Game {
    		static addNewPlayer() {
    			if (playerName !== "") {
    				set_store_value(players, $players = [...$players, new Player(playerName)], $players);
    				$$invalidate(0, playerName = "");
    			}
    		}

    		static startNewGame() {
    			if ($players.length >= 2) {
    				dispatch("start");
    			}
    		}
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<StartMenu> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		playerName = this.value;
    		$$invalidate(0, playerName);
    	}

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		Player,
    		players,
    		dispatch,
    		playerName,
    		Game,
    		$players
    	});

    	$$self.$inject_state = $$props => {
    		if ("playerName" in $$props) $$invalidate(0, playerName = $$props.playerName);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [playerName, $players, Game, input_input_handler];
    }

    class StartMenu extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		if (!document.getElementById("svelte-1nwwoem-style")) add_css();
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "StartMenu",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    /* src/UI/singlePlayer/SinglePlayerGame.svelte generated by Svelte v3.29.0 */
    const file$1 = "src/UI/singlePlayer/SinglePlayerGame.svelte";

    function add_css$1() {
    	var style = element("style");
    	style.id = "svelte-4bf3n3-style";
    	style.textContent = ".lose.svelte-4bf3n3{color:red}.text_bold.svelte-4bf3n3{font-weight:bold}.game_field.svelte-4bf3n3{width:35%;margin:0 auto;text-align:center}.player_interface.svelte-4bf3n3{border:1px solid #8a8a8a;background-color:#e6e0246e;border-radius:3px;margin-bottom:15px;padding:10px}h2.svelte-4bf3n3{margin:0;margin-bottom:10px}button.svelte-4bf3n3{margin:5px 3px;background-color:#007eff;border:1px solid #0400ffb0;padding:5px 10px;color:white;font-weight:bold;border-radius:5px;font-style:italic;cursor:pointer;transition:0.4s}button.svelte-4bf3n3:hover{background-color:#0014ff;transition:0.4s}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU2luZ2xlUGxheWVyR2FtZS5zdmVsdGUiLCJzb3VyY2VzIjpbIlNpbmdsZVBsYXllckdhbWUuc3ZlbHRlIl0sInNvdXJjZXNDb250ZW50IjpbIjxzY3JpcHQ+XG4gICAgaW1wb3J0IHtwbGF5ZXJzfSBmcm9tIFwiLi4vLi4vc3RvcmVcIjtcblxuICAgIGZ1bmN0aW9uIGFkZFNjb3JlUGxheWVyKHBsYXllciwgc2NvcmUpIHtcbiAgICAgICAgcGxheWVyLmFkZFNjb3JlKHNjb3JlKTtcbiAgICAgICAgJHBsYXllcnMgPSBbLi4uJHBsYXllcnNdO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHJlc2V0U2NvcmVQbGF5ZXIocGxheWVyKSB7XG4gICAgICAgIHBsYXllci5yZXNldFNjb3JlKCk7XG4gICAgICAgICRwbGF5ZXJzID0gWy4uLiRwbGF5ZXJzXTtcbiAgICB9XG48L3NjcmlwdD5cblxuPHN0eWxlPlxuICAgIC5sb3NlIHtcbiAgICAgICAgY29sb3I6IHJlZDtcbiAgICB9XG5cbiAgICAudGV4dF9ib2xkIHtcbiAgICAgICAgZm9udC13ZWlnaHQ6IGJvbGQ7XG4gICAgfVxuXG4gICAgLmdhbWVfZmllbGQge1xuICAgICAgICB3aWR0aDogMzUlO1xuICAgICAgICBtYXJnaW46IDAgYXV0bztcbiAgICAgICAgdGV4dC1hbGlnbjogY2VudGVyO1xuICAgIH1cblxuICAgIC5wbGF5ZXJfaW50ZXJmYWNlIHtcbiAgICAgICAgYm9yZGVyOiAxcHggc29saWQgIzhhOGE4YTtcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogI2U2ZTAyNDZlO1xuICAgICAgICBib3JkZXItcmFkaXVzOiAzcHg7XG4gICAgICAgIG1hcmdpbi1ib3R0b206IDE1cHg7XG4gICAgICAgIHBhZGRpbmc6IDEwcHg7XG4gICAgfVxuXG4gICAgaDIge1xuICAgICAgICBtYXJnaW46IDA7XG4gICAgICAgIG1hcmdpbi1ib3R0b206IDEwcHg7XG4gICAgfVxuXG4gICAgYnV0dG9uIHtcbiAgICAgICAgbWFyZ2luOiA1cHggM3B4O1xuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjMDA3ZWZmO1xuICAgICAgICBib3JkZXI6IDFweCBzb2xpZCAjMDQwMGZmYjA7XG4gICAgICAgIHBhZGRpbmc6IDVweCAxMHB4O1xuICAgICAgICBjb2xvcjogd2hpdGU7XG4gICAgICAgIGZvbnQtd2VpZ2h0OiBib2xkO1xuICAgICAgICBib3JkZXItcmFkaXVzOiA1cHg7XG4gICAgICAgIGZvbnQtc3R5bGU6IGl0YWxpYztcbiAgICAgICAgY3Vyc29yOiBwb2ludGVyO1xuICAgICAgICB0cmFuc2l0aW9uOiAwLjRzO1xuICAgIH1cblxuICAgIGJ1dHRvbjpob3ZlciB7XG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6ICMwMDE0ZmY7XG4gICAgICAgIHRyYW5zaXRpb246IDAuNHM7XG4gICAgfVxuPC9zdHlsZT5cblxuPGRpdiBjbGFzcz1cImdhbWVfZmllbGRcIj5cbiAgICB7I2VhY2ggJHBsYXllcnMgYXMgcGxheWVyLCBpbmRleCAocGxheWVyKX1cbiAgICAgICAgPGRpdiBjbGFzcz1cInBsYXllcl9pbnRlcmZhY2VcIj5cbiAgICAgICAgICAgIHsjaWYgcGxheWVyLnNjb3JlID4gMTAxfVxuICAgICAgICAgICAgICAgIDxoMiBjbGFzcz1cImxvc2VcIj5cbiAgICAgICAgICAgICAgICAgICAge3BsYXllci5uYW1lfVxuICAgICAgICAgICAgICAgICAgICB8fCDQntGH0LrQuDp7cGxheWVyLnNjb3JlfVxuICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cInRleHRfYm9sZFwiPtCf0YDQvtC40LPRgNGL0Yg8L3NwYW4+XG4gICAgICAgICAgICAgICAgPC9oMj5cbiAgICAgICAgICAgIHs6ZWxzZX1cbiAgICAgICAgICAgICAgICA8aDI+e3BsYXllci5uYW1lfSB8fCDQntGH0LrQuDp7cGxheWVyLnNjb3JlfTwvaDI+XG4gICAgICAgICAgICB7L2lmfVxuICAgICAgICAgICAgeyNlYWNoIHBsYXllci5jYXJkcyBhcyBjYXJkLCBpbmRleCAoaW5kZXgpfVxuICAgICAgICAgICAgICAgIDxidXR0b24gdmFsdWU9e2NhcmQudmFsdWV9IG9uOmNsaWNrPXthZGRTY29yZVBsYXllcihwbGF5ZXIsIGNhcmQudmFsdWUpfT57Y2FyZC5jYXJkfTwvYnV0dG9uPlxuICAgICAgICAgICAgey9lYWNofVxuICAgICAgICAgICAgPGJ1dHRvbiBvbjpjbGljaz17cmVzZXRTY29yZVBsYXllcihwbGF5ZXIpfT7QodCx0YDQvtGBPC9idXR0b24+XG4gICAgICAgICAgICA8YnV0dG9uIG9uOmNsaWNrPXthZGRTY29yZVBsYXllcihwbGF5ZXIsIC0yMCl9Pi0yMDwvYnV0dG9uPlxuICAgICAgICAgICAgPGJ1dHRvbiBvbjpjbGljaz17YWRkU2NvcmVQbGF5ZXIocGxheWVyLCAtNDApfT4tNDA8L2J1dHRvbj5cbiAgICAgICAgPC9kaXY+XG4gICAgey9lYWNofVxuPC9kaXY+XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBZUksS0FBSyxjQUFDLENBQUMsQUFDSCxLQUFLLENBQUUsR0FBRyxBQUNkLENBQUMsQUFFRCxVQUFVLGNBQUMsQ0FBQyxBQUNSLFdBQVcsQ0FBRSxJQUFJLEFBQ3JCLENBQUMsQUFFRCxXQUFXLGNBQUMsQ0FBQyxBQUNULEtBQUssQ0FBRSxHQUFHLENBQ1YsTUFBTSxDQUFFLENBQUMsQ0FBQyxJQUFJLENBQ2QsVUFBVSxDQUFFLE1BQU0sQUFDdEIsQ0FBQyxBQUVELGlCQUFpQixjQUFDLENBQUMsQUFDZixNQUFNLENBQUUsR0FBRyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQ3pCLGdCQUFnQixDQUFFLFNBQVMsQ0FDM0IsYUFBYSxDQUFFLEdBQUcsQ0FDbEIsYUFBYSxDQUFFLElBQUksQ0FDbkIsT0FBTyxDQUFFLElBQUksQUFDakIsQ0FBQyxBQUVELEVBQUUsY0FBQyxDQUFDLEFBQ0EsTUFBTSxDQUFFLENBQUMsQ0FDVCxhQUFhLENBQUUsSUFBSSxBQUN2QixDQUFDLEFBRUQsTUFBTSxjQUFDLENBQUMsQUFDSixNQUFNLENBQUUsR0FBRyxDQUFDLEdBQUcsQ0FDZixnQkFBZ0IsQ0FBRSxPQUFPLENBQ3pCLE1BQU0sQ0FBRSxHQUFHLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FDM0IsT0FBTyxDQUFFLEdBQUcsQ0FBQyxJQUFJLENBQ2pCLEtBQUssQ0FBRSxLQUFLLENBQ1osV0FBVyxDQUFFLElBQUksQ0FDakIsYUFBYSxDQUFFLEdBQUcsQ0FDbEIsVUFBVSxDQUFFLE1BQU0sQ0FDbEIsTUFBTSxDQUFFLE9BQU8sQ0FDZixVQUFVLENBQUUsSUFBSSxBQUNwQixDQUFDLEFBRUQsb0JBQU0sTUFBTSxBQUFDLENBQUMsQUFDVixnQkFBZ0IsQ0FBRSxPQUFPLENBQ3pCLFVBQVUsQ0FBRSxJQUFJLEFBQ3BCLENBQUMifQ== */";
    	append_dev(document.head, style);
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	child_ctx[5] = i;
    	return child_ctx;
    }

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	child_ctx[5] = i;
    	return child_ctx;
    }

    // (71:12) {:else}
    function create_else_block(ctx) {
    	let h2;
    	let t0_value = /*player*/ ctx[3].name + "";
    	let t0;
    	let t1;
    	let t2_value = /*player*/ ctx[3].score + "";
    	let t2;

    	const block = {
    		c: function create() {
    			h2 = element("h2");
    			t0 = text(t0_value);
    			t1 = text(" || Очки:");
    			t2 = text(t2_value);
    			attr_dev(h2, "class", "svelte-4bf3n3");
    			add_location(h2, file$1, 71, 16, 1504);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h2, anchor);
    			append_dev(h2, t0);
    			append_dev(h2, t1);
    			append_dev(h2, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$players*/ 1 && t0_value !== (t0_value = /*player*/ ctx[3].name + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*$players*/ 1 && t2_value !== (t2_value = /*player*/ ctx[3].score + "")) set_data_dev(t2, t2_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(71:12) {:else}",
    		ctx
    	});

    	return block;
    }

    // (65:12) {#if player.score > 101}
    function create_if_block$1(ctx) {
    	let h2;
    	let t0_value = /*player*/ ctx[3].name + "";
    	let t0;
    	let t1;
    	let t2_value = /*player*/ ctx[3].score + "";
    	let t2;
    	let t3;
    	let span;

    	const block = {
    		c: function create() {
    			h2 = element("h2");
    			t0 = text(t0_value);
    			t1 = text("\n                    || Очки:");
    			t2 = text(t2_value);
    			t3 = space();
    			span = element("span");
    			span.textContent = "Проигрыш";
    			attr_dev(span, "class", "text_bold svelte-4bf3n3");
    			add_location(span, file$1, 68, 20, 1406);
    			attr_dev(h2, "class", "lose svelte-4bf3n3");
    			add_location(h2, file$1, 65, 16, 1291);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h2, anchor);
    			append_dev(h2, t0);
    			append_dev(h2, t1);
    			append_dev(h2, t2);
    			append_dev(h2, t3);
    			append_dev(h2, span);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$players*/ 1 && t0_value !== (t0_value = /*player*/ ctx[3].name + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*$players*/ 1 && t2_value !== (t2_value = /*player*/ ctx[3].score + "")) set_data_dev(t2, t2_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(65:12) {#if player.score > 101}",
    		ctx
    	});

    	return block;
    }

    // (74:12) {#each player.cards as card, index (index)}
    function create_each_block_1(key_1, ctx) {
    	let button;
    	let t_value = /*card*/ ctx[6].card + "";
    	let t;
    	let button_value_value;
    	let mounted;
    	let dispose;

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			button = element("button");
    			t = text(t_value);
    			button.value = button_value_value = /*card*/ ctx[6].value;
    			attr_dev(button, "class", "svelte-4bf3n3");
    			add_location(button, file$1, 74, 16, 1640);
    			this.first = button;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t);

    			if (!mounted) {
    				dispose = listen_dev(
    					button,
    					"click",
    					function () {
    						if (is_function(/*addScorePlayer*/ ctx[1](/*player*/ ctx[3], /*card*/ ctx[6].value))) /*addScorePlayer*/ ctx[1](/*player*/ ctx[3], /*card*/ ctx[6].value).apply(this, arguments);
    					},
    					false,
    					false,
    					false
    				);

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*$players*/ 1 && t_value !== (t_value = /*card*/ ctx[6].card + "")) set_data_dev(t, t_value);

    			if (dirty & /*$players*/ 1 && button_value_value !== (button_value_value = /*card*/ ctx[6].value)) {
    				prop_dev(button, "value", button_value_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(74:12) {#each player.cards as card, index (index)}",
    		ctx
    	});

    	return block;
    }

    // (63:4) {#each $players as player, index (player)}
    function create_each_block$1(key_1, ctx) {
    	let div;
    	let t0;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let t1;
    	let button0;
    	let t3;
    	let button1;
    	let t5;
    	let button2;
    	let t7;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*player*/ ctx[3].score > 101) return create_if_block$1;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);
    	let each_value_1 = /*player*/ ctx[3].cards;
    	validate_each_argument(each_value_1);
    	const get_key = ctx => /*index*/ ctx[5];
    	validate_each_keys(ctx, each_value_1, get_each_context_1, get_key);

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		let child_ctx = get_each_context_1(ctx, each_value_1, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block_1(key, child_ctx));
    	}

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			div = element("div");
    			if_block.c();
    			t0 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t1 = space();
    			button0 = element("button");
    			button0.textContent = "Сброс";
    			t3 = space();
    			button1 = element("button");
    			button1.textContent = "-20";
    			t5 = space();
    			button2 = element("button");
    			button2.textContent = "-40";
    			t7 = space();
    			attr_dev(button0, "class", "svelte-4bf3n3");
    			add_location(button0, file$1, 76, 12, 1766);
    			attr_dev(button1, "class", "svelte-4bf3n3");
    			add_location(button1, file$1, 77, 12, 1837);
    			attr_dev(button2, "class", "svelte-4bf3n3");
    			add_location(button2, file$1, 78, 12, 1909);
    			attr_dev(div, "class", "player_interface svelte-4bf3n3");
    			add_location(div, file$1, 63, 8, 1207);
    			this.first = div;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if_block.m(div, null);
    			append_dev(div, t0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			append_dev(div, t1);
    			append_dev(div, button0);
    			append_dev(div, t3);
    			append_dev(div, button1);
    			append_dev(div, t5);
    			append_dev(div, button2);
    			append_dev(div, t7);

    			if (!mounted) {
    				dispose = [
    					listen_dev(
    						button0,
    						"click",
    						function () {
    							if (is_function(/*resetScorePlayer*/ ctx[2](/*player*/ ctx[3]))) /*resetScorePlayer*/ ctx[2](/*player*/ ctx[3]).apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					),
    					listen_dev(
    						button1,
    						"click",
    						function () {
    							if (is_function(/*addScorePlayer*/ ctx[1](/*player*/ ctx[3], -20))) /*addScorePlayer*/ ctx[1](/*player*/ ctx[3], -20).apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					),
    					listen_dev(
    						button2,
    						"click",
    						function () {
    							if (is_function(/*addScorePlayer*/ ctx[1](/*player*/ ctx[3], -40))) /*addScorePlayer*/ ctx[1](/*player*/ ctx[3], -40).apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div, t0);
    				}
    			}

    			if (dirty & /*$players, addScorePlayer*/ 3) {
    				const each_value_1 = /*player*/ ctx[3].cards;
    				validate_each_argument(each_value_1);
    				validate_each_keys(ctx, each_value_1, get_each_context_1, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value_1, each_1_lookup, div, destroy_block, create_each_block_1, t1, get_each_context_1);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_block.d();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}

    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(63:4) {#each $players as player, index (player)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let each_value = /*$players*/ ctx[0];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*player*/ ctx[3];
    	validate_each_keys(ctx, each_value, get_each_context$1, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$1(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block$1(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "game_field svelte-4bf3n3");
    			add_location(div, file$1, 61, 0, 1127);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*addScorePlayer, $players, resetScorePlayer*/ 7) {
    				const each_value = /*$players*/ ctx[0];
    				validate_each_argument(each_value);
    				validate_each_keys(ctx, each_value, get_each_context$1, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, div, destroy_block, create_each_block$1, null, get_each_context$1);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let $players;
    	validate_store(players, "players");
    	component_subscribe($$self, players, $$value => $$invalidate(0, $players = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("SinglePlayerGame", slots, []);

    	function addScorePlayer(player, score) {
    		player.addScore(score);
    		set_store_value(players, $players = [...$players], $players);
    	}

    	function resetScorePlayer(player) {
    		player.resetScore();
    		set_store_value(players, $players = [...$players], $players);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<SinglePlayerGame> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		players,
    		addScorePlayer,
    		resetScorePlayer,
    		$players
    	});

    	return [$players, addScorePlayer, resetScorePlayer];
    }

    class SinglePlayerGame extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		if (!document.getElementById("svelte-4bf3n3-style")) add_css$1();
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SinglePlayerGame",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    class SocketClient {
        socket = null;

        constructor() {
            // Создаём активное подключение к сокету на сервере
            this.socket = io__default['default']({path: "/api"});

            // Обрабатываем событие login
            this.socket.on("login", (data) => {
                this.onlogin(data);
            });

            this.socket.on('turn', (turn) => {
                turns.set([...get_store_value(turns), turn]);
                lastTurn.set(turn);
            });
            this.socket.on("updateLobby", this.updateLobby);
            this.socket.on("message", this.incommingMessage);
        }

        updateLobby(users) {
            // Обновляем в реальном времени состояние подключенных пользователей
            players.set(users);
        }

        login(name) {
            this.socket.emit("login", name);
        }

        // Первое подключение
        onlogin(data) {
            if (data) {
                this.socket.send("Hi all!");
            } else {
                console.log("Bad login");
            }
        }

        incommingMessage(message) {
            console.log(message);
        }

        sendMessage(text) {
            this.socket.send(text);
        }

        startGame() {
            this.socket.emit('start');
        }

        turn(card) {
            this.socket.emit('turn', card);
        }
    }

    const socketClient = new SocketClient();

    /* src/UI/multiPlayer/StartMenu.svelte generated by Svelte v3.29.0 */
    const file$2 = "src/UI/multiPlayer/StartMenu.svelte";

    function add_css$2() {
    	var style = element("style");
    	style.id = "svelte-1nwwoem-style";
    	style.textContent = ".start_main.svelte-1nwwoem.svelte-1nwwoem{margin:0 auto;width:25%;text-align:center}.start_adding_new_players.svelte-1nwwoem.svelte-1nwwoem{border:1px solid #00000014;border-radius:5px;background-color:#f1f1f196;padding:10px}.start_adding_new_players.svelte-1nwwoem h2.svelte-1nwwoem{margin:5px 0}.start_adding_new_players.svelte-1nwwoem button.svelte-1nwwoem{margin:5px 0;background-color:#007eff;border:1px solid #0400ffb0;padding:5px 10px;color:white;font-weight:bold;border-radius:5px;font-style:italic;cursor:pointer;transition:0.4s}.start_adding_new_players.svelte-1nwwoem button.svelte-1nwwoem:hover{background-color:#0014ff;transition:0.4s}.start_adding_new_players.svelte-1nwwoem input.svelte-1nwwoem{box-sizing:border-box;margin:5px auto;font-family:inherit;overflow:visible;display:block;color:#495057;background-color:#fff;background-clip:padding-box;border:1px solid #ced4da;transition:border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;padding:0.25rem 0.5rem;font-size:0.875rem;line-height:1.5;border-radius:0.2rem;position:relative;flex:1 1 auto;width:100%}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU3RhcnRNZW51LnN2ZWx0ZSIsInNvdXJjZXMiOlsiU3RhcnRNZW51LnN2ZWx0ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8c2NyaXB0PlxyXG4gICAgaW1wb3J0IHtjcmVhdGVFdmVudERpc3BhdGNoZXJ9IGZyb20gXCJzdmVsdGVcIjtcclxuICAgIGltcG9ydCBTb2NrZXRDbGllbnQgZnJvbSAnLi4vLi4vY2xhc3Nlcy9Tb2NrZXRDbGllbnQnO1xyXG5cclxuICAgIGNvbnN0IGRpc3BhdGNoID0gY3JlYXRlRXZlbnREaXNwYXRjaGVyKCk7XHJcblxyXG4gICAgbGV0IHBsYXllck5hbWUgPSBcIlwiO1xyXG5cclxuICAgIGNsYXNzIEdhbWUge1xyXG4gICAgICAgIHN0YXRpYyBjb25uZWN0UGxheWVyKCkge1xyXG4gICAgICAgICAgICBpZiAocGxheWVyTmFtZS50cmltKCkgIT09IFwiXCIpIHtcclxuICAgICAgICAgICAgICAgIFNvY2tldENsaWVudC5sb2dpbihwbGF5ZXJOYW1lLnRyaW0oKSk7XHJcbiAgICAgICAgICAgICAgICBkaXNwYXRjaChcImxvZ2luSW5Mb2JieVwiKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gc3RhdGljIHN0YXJ0TmV3R2FtZSgpIHtcclxuICAgICAgICAvLyAgICAgZGlzcGF0Y2goXCJzdGFydFwiKTtcclxuICAgICAgICAvLyB9XHJcbiAgICB9XHJcbjwvc2NyaXB0PlxyXG5cclxuPHN0eWxlPlxyXG4gICAgLnN0YXJ0X21haW4ge1xyXG4gICAgICAgIG1hcmdpbjogMCBhdXRvO1xyXG4gICAgICAgIHdpZHRoOiAyNSU7XHJcbiAgICAgICAgdGV4dC1hbGlnbjogY2VudGVyO1xyXG4gICAgfVxyXG5cclxuICAgIC5zdGFydF9hZGRpbmdfbmV3X3BsYXllcnMge1xyXG4gICAgICAgIGJvcmRlcjogMXB4IHNvbGlkICMwMDAwMDAxNDtcclxuICAgICAgICBib3JkZXItcmFkaXVzOiA1cHg7XHJcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogI2YxZjFmMTk2O1xyXG4gICAgICAgIHBhZGRpbmc6IDEwcHg7XHJcbiAgICB9XHJcblxyXG4gICAgLnN0YXJ0X2FkZGluZ19uZXdfcGxheWVycyBoMiB7XHJcbiAgICAgICAgbWFyZ2luOiA1cHggMDtcclxuICAgIH1cclxuXHJcbiAgICAuc3RhcnRfYWRkaW5nX25ld19wbGF5ZXJzIGJ1dHRvbixcclxuICAgIC5zdGFydF9uZXdfZ2FtZSBidXR0b24ge1xyXG4gICAgICAgIG1hcmdpbjogNXB4IDA7XHJcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogIzAwN2VmZjtcclxuICAgICAgICBib3JkZXI6IDFweCBzb2xpZCAjMDQwMGZmYjA7XHJcbiAgICAgICAgcGFkZGluZzogNXB4IDEwcHg7XHJcbiAgICAgICAgY29sb3I6IHdoaXRlO1xyXG4gICAgICAgIGZvbnQtd2VpZ2h0OiBib2xkO1xyXG4gICAgICAgIGJvcmRlci1yYWRpdXM6IDVweDtcclxuICAgICAgICBmb250LXN0eWxlOiBpdGFsaWM7XHJcbiAgICAgICAgY3Vyc29yOiBwb2ludGVyO1xyXG4gICAgICAgIHRyYW5zaXRpb246IDAuNHM7XHJcbiAgICB9XHJcblxyXG4gICAgLnN0YXJ0X2FkZGluZ19uZXdfcGxheWVycyBidXR0b246aG92ZXIsXHJcbiAgICAuc3RhcnRfbmV3X2dhbWUgYnV0dG9uOmhvdmVyIHtcclxuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjMDAxNGZmO1xyXG4gICAgICAgIHRyYW5zaXRpb246IDAuNHM7XHJcbiAgICB9XHJcblxyXG4gICAgLnN0YXJ0X2FkZGluZ19uZXdfcGxheWVycyBpbnB1dCB7XHJcbiAgICAgICAgYm94LXNpemluZzogYm9yZGVyLWJveDtcclxuICAgICAgICBtYXJnaW46IDVweCBhdXRvO1xyXG4gICAgICAgIGZvbnQtZmFtaWx5OiBpbmhlcml0O1xyXG4gICAgICAgIG92ZXJmbG93OiB2aXNpYmxlO1xyXG4gICAgICAgIGRpc3BsYXk6IGJsb2NrO1xyXG4gICAgICAgIGNvbG9yOiAjNDk1MDU3O1xyXG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6ICNmZmY7XHJcbiAgICAgICAgYmFja2dyb3VuZC1jbGlwOiBwYWRkaW5nLWJveDtcclxuICAgICAgICBib3JkZXI6IDFweCBzb2xpZCAjY2VkNGRhO1xyXG4gICAgICAgIHRyYW5zaXRpb246IGJvcmRlci1jb2xvciAwLjE1cyBlYXNlLWluLW91dCwgYm94LXNoYWRvdyAwLjE1cyBlYXNlLWluLW91dDtcclxuICAgICAgICBwYWRkaW5nOiAwLjI1cmVtIDAuNXJlbTtcclxuICAgICAgICBmb250LXNpemU6IDAuODc1cmVtO1xyXG4gICAgICAgIGxpbmUtaGVpZ2h0OiAxLjU7XHJcbiAgICAgICAgYm9yZGVyLXJhZGl1czogMC4ycmVtO1xyXG4gICAgICAgIHBvc2l0aW9uOiByZWxhdGl2ZTtcclxuICAgICAgICBmbGV4OiAxIDEgYXV0bztcclxuICAgICAgICB3aWR0aDogMTAwJTtcclxuICAgIH1cclxuPC9zdHlsZT5cclxuXHJcbjxkaXYgY2xhc3M9XCJzdGFydF9tYWluXCI+XHJcbiAgICA8ZGl2IGNsYXNzPVwic3RhcnRfYWRkaW5nX25ld19wbGF5ZXJzXCI+XHJcbiAgICAgICAgPGgyPtCS0LLQtdC00LjRgtC1INC40LzRjyDQuNCz0YDQvtC60LA8L2gyPlxyXG4gICAgICAgIDxsYWJlbCBmb3I9XCJwbGF5ZXJfbmFtZVwiPlxyXG4gICAgICAgICAgICA8aW5wdXQgdHlwZT1cInRleHRcIiBpZD1cInBsYXllcl9uYW1lXCIgYmluZDp2YWx1ZT17cGxheWVyTmFtZX0vPlxyXG4gICAgICAgIDwvbGFiZWw+XHJcbiAgICAgICAgPGJ1dHRvbiBvbjpjbGljaz17R2FtZS5jb25uZWN0UGxheWVyfT7Qn9C+0LTQutC70Y7Rh9C40YLRjNGB0Y88L2J1dHRvbj5cclxuICAgIDwvZGl2PlxyXG48L2Rpdj5cclxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQXVCSSxXQUFXLDhCQUFDLENBQUMsQUFDVCxNQUFNLENBQUUsQ0FBQyxDQUFDLElBQUksQ0FDZCxLQUFLLENBQUUsR0FBRyxDQUNWLFVBQVUsQ0FBRSxNQUFNLEFBQ3RCLENBQUMsQUFFRCx5QkFBeUIsOEJBQUMsQ0FBQyxBQUN2QixNQUFNLENBQUUsR0FBRyxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQzNCLGFBQWEsQ0FBRSxHQUFHLENBQ2xCLGdCQUFnQixDQUFFLFNBQVMsQ0FDM0IsT0FBTyxDQUFFLElBQUksQUFDakIsQ0FBQyxBQUVELHdDQUF5QixDQUFDLEVBQUUsZUFBQyxDQUFDLEFBQzFCLE1BQU0sQ0FBRSxHQUFHLENBQUMsQ0FBQyxBQUNqQixDQUFDLEFBRUQsd0NBQXlCLENBQUMsTUFBTSxlQUNULENBQUMsQUFDcEIsTUFBTSxDQUFFLEdBQUcsQ0FBQyxDQUFDLENBQ2IsZ0JBQWdCLENBQUUsT0FBTyxDQUN6QixNQUFNLENBQUUsR0FBRyxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQzNCLE9BQU8sQ0FBRSxHQUFHLENBQUMsSUFBSSxDQUNqQixLQUFLLENBQUUsS0FBSyxDQUNaLFdBQVcsQ0FBRSxJQUFJLENBQ2pCLGFBQWEsQ0FBRSxHQUFHLENBQ2xCLFVBQVUsQ0FBRSxNQUFNLENBQ2xCLE1BQU0sQ0FBRSxPQUFPLENBQ2YsVUFBVSxDQUFFLElBQUksQUFDcEIsQ0FBQyxBQUVELHdDQUF5QixDQUFDLHFCQUFNLE1BQU0sQUFDVCxDQUFDLEFBQzFCLGdCQUFnQixDQUFFLE9BQU8sQ0FDekIsVUFBVSxDQUFFLElBQUksQUFDcEIsQ0FBQyxBQUVELHdDQUF5QixDQUFDLEtBQUssZUFBQyxDQUFDLEFBQzdCLFVBQVUsQ0FBRSxVQUFVLENBQ3RCLE1BQU0sQ0FBRSxHQUFHLENBQUMsSUFBSSxDQUNoQixXQUFXLENBQUUsT0FBTyxDQUNwQixRQUFRLENBQUUsT0FBTyxDQUNqQixPQUFPLENBQUUsS0FBSyxDQUNkLEtBQUssQ0FBRSxPQUFPLENBQ2QsZ0JBQWdCLENBQUUsSUFBSSxDQUN0QixlQUFlLENBQUUsV0FBVyxDQUM1QixNQUFNLENBQUUsR0FBRyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQ3pCLFVBQVUsQ0FBRSxZQUFZLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUN4RSxPQUFPLENBQUUsT0FBTyxDQUFDLE1BQU0sQ0FDdkIsU0FBUyxDQUFFLFFBQVEsQ0FDbkIsV0FBVyxDQUFFLEdBQUcsQ0FDaEIsYUFBYSxDQUFFLE1BQU0sQ0FDckIsUUFBUSxDQUFFLFFBQVEsQ0FDbEIsSUFBSSxDQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUNkLEtBQUssQ0FBRSxJQUFJLEFBQ2YsQ0FBQyJ9 */";
    	append_dev(document.head, style);
    }

    function create_fragment$2(ctx) {
    	let div1;
    	let div0;
    	let h2;
    	let t1;
    	let label;
    	let input;
    	let t2;
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			h2 = element("h2");
    			h2.textContent = "Введите имя игрока";
    			t1 = space();
    			label = element("label");
    			input = element("input");
    			t2 = space();
    			button = element("button");
    			button.textContent = "Подключиться";
    			attr_dev(h2, "class", "svelte-1nwwoem");
    			add_location(h2, file$2, 83, 8, 2095);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "id", "player_name");
    			attr_dev(input, "class", "svelte-1nwwoem");
    			add_location(input, file$2, 85, 12, 2171);
    			attr_dev(label, "for", "player_name");
    			add_location(label, file$2, 84, 8, 2132);
    			attr_dev(button, "class", "svelte-1nwwoem");
    			add_location(button, file$2, 87, 8, 2260);
    			attr_dev(div0, "class", "start_adding_new_players svelte-1nwwoem");
    			add_location(div0, file$2, 82, 4, 2047);
    			attr_dev(div1, "class", "start_main svelte-1nwwoem");
    			add_location(div1, file$2, 81, 0, 2017);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, h2);
    			append_dev(div0, t1);
    			append_dev(div0, label);
    			append_dev(label, input);
    			set_input_value(input, /*playerName*/ ctx[0]);
    			append_dev(div0, t2);
    			append_dev(div0, button);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[2]),
    					listen_dev(button, "click", /*Game*/ ctx[1].connectPlayer, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*playerName*/ 1 && input.value !== /*playerName*/ ctx[0]) {
    				set_input_value(input, /*playerName*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("StartMenu", slots, []);
    	const dispatch = createEventDispatcher();
    	let playerName = "";

    	class Game {
    		static connectPlayer() {
    			if (playerName.trim() !== "") {
    				socketClient.login(playerName.trim());
    				dispatch("loginInLobby");
    			}
    		}
    	} // static startNewGame() {
    	//     dispatch("start");

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<StartMenu> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		playerName = this.value;
    		$$invalidate(0, playerName);
    	}

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		SocketClient: socketClient,
    		dispatch,
    		playerName,
    		Game
    	});

    	$$self.$inject_state = $$props => {
    		if ("playerName" in $$props) $$invalidate(0, playerName = $$props.playerName);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [playerName, Game, input_input_handler];
    }

    class StartMenu$1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		if (!document.getElementById("svelte-1nwwoem-style")) add_css$2();
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "StartMenu",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/UI/multiPlayer/MultiPlayerGame.svelte generated by Svelte v3.29.0 */
    const file$3 = "src/UI/multiPlayer/MultiPlayerGame.svelte";

    function add_css$3() {
    	var style = element("style");
    	style.id = "svelte-4bf3n3-style";
    	style.textContent = ".lose.svelte-4bf3n3{color:red}.text_bold.svelte-4bf3n3{font-weight:bold}.game_field.svelte-4bf3n3{width:35%;margin:0 auto;text-align:center}.player_interface.svelte-4bf3n3{border:1px solid #8a8a8a;background-color:#e6e0246e;border-radius:3px;margin-bottom:15px;padding:10px}h2.svelte-4bf3n3{margin:0;margin-bottom:10px}button.svelte-4bf3n3{margin:5px 3px;background-color:#007eff;border:1px solid #0400ffb0;padding:5px 10px;color:white;font-weight:bold;border-radius:5px;font-style:italic;cursor:pointer;transition:0.4s}button.svelte-4bf3n3:hover{background-color:#0014ff;transition:0.4s}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTXVsdGlQbGF5ZXJHYW1lLnN2ZWx0ZSIsInNvdXJjZXMiOlsiTXVsdGlQbGF5ZXJHYW1lLnN2ZWx0ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8c2NyaXB0PlxyXG4gICAgaW1wb3J0IHtwbGF5ZXJzfSBmcm9tIFwiLi4vLi4vc3RvcmVcIjtcclxuXHJcbiAgICBmdW5jdGlvbiBhZGRTY29yZVBsYXllcihwbGF5ZXIsIHNjb3JlKSB7XHJcbiAgICAgICAgcGxheWVyLmFkZFNjb3JlKHNjb3JlKTtcclxuICAgICAgICAkcGxheWVycyA9IFsuLi4kcGxheWVyc107XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gcmVzZXRTY29yZVBsYXllcihwbGF5ZXIpIHtcclxuICAgICAgICBwbGF5ZXIucmVzZXRTY29yZSgpO1xyXG4gICAgICAgICRwbGF5ZXJzID0gWy4uLiRwbGF5ZXJzXTtcclxuICAgIH1cclxuPC9zY3JpcHQ+XHJcblxyXG48c3R5bGU+XHJcbiAgICAubG9zZSB7XHJcbiAgICAgICAgY29sb3I6IHJlZDtcclxuICAgIH1cclxuXHJcbiAgICAudGV4dF9ib2xkIHtcclxuICAgICAgICBmb250LXdlaWdodDogYm9sZDtcclxuICAgIH1cclxuXHJcbiAgICAuZ2FtZV9maWVsZCB7XHJcbiAgICAgICAgd2lkdGg6IDM1JTtcclxuICAgICAgICBtYXJnaW46IDAgYXV0bztcclxuICAgICAgICB0ZXh0LWFsaWduOiBjZW50ZXI7XHJcbiAgICB9XHJcblxyXG4gICAgLnBsYXllcl9pbnRlcmZhY2Uge1xyXG4gICAgICAgIGJvcmRlcjogMXB4IHNvbGlkICM4YThhOGE7XHJcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogI2U2ZTAyNDZlO1xyXG4gICAgICAgIGJvcmRlci1yYWRpdXM6IDNweDtcclxuICAgICAgICBtYXJnaW4tYm90dG9tOiAxNXB4O1xyXG4gICAgICAgIHBhZGRpbmc6IDEwcHg7XHJcbiAgICB9XHJcblxyXG4gICAgaDIge1xyXG4gICAgICAgIG1hcmdpbjogMDtcclxuICAgICAgICBtYXJnaW4tYm90dG9tOiAxMHB4O1xyXG4gICAgfVxyXG5cclxuICAgIGJ1dHRvbiB7XHJcbiAgICAgICAgbWFyZ2luOiA1cHggM3B4O1xyXG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6ICMwMDdlZmY7XHJcbiAgICAgICAgYm9yZGVyOiAxcHggc29saWQgIzA0MDBmZmIwO1xyXG4gICAgICAgIHBhZGRpbmc6IDVweCAxMHB4O1xyXG4gICAgICAgIGNvbG9yOiB3aGl0ZTtcclxuICAgICAgICBmb250LXdlaWdodDogYm9sZDtcclxuICAgICAgICBib3JkZXItcmFkaXVzOiA1cHg7XHJcbiAgICAgICAgZm9udC1zdHlsZTogaXRhbGljO1xyXG4gICAgICAgIGN1cnNvcjogcG9pbnRlcjtcclxuICAgICAgICB0cmFuc2l0aW9uOiAwLjRzO1xyXG4gICAgfVxyXG5cclxuICAgIGJ1dHRvbjpob3ZlciB7XHJcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogIzAwMTRmZjtcclxuICAgICAgICB0cmFuc2l0aW9uOiAwLjRzO1xyXG4gICAgfVxyXG48L3N0eWxlPlxyXG5cclxuPGRpdiBjbGFzcz1cImdhbWVfZmllbGRcIj5cclxuICAgIHsjZWFjaCAkcGxheWVycyBhcyBwbGF5ZXIsIGluZGV4IChwbGF5ZXIpfVxyXG4gICAgICAgIDxkaXYgY2xhc3M9XCJwbGF5ZXJfaW50ZXJmYWNlXCI+XHJcbiAgICAgICAgICAgIHsjaWYgcGxheWVyLnNjb3JlID4gMTAxfVxyXG4gICAgICAgICAgICAgICAgPGgyIGNsYXNzPVwibG9zZVwiPlxyXG4gICAgICAgICAgICAgICAgICAgIHtwbGF5ZXIubmFtZX1cclxuICAgICAgICAgICAgICAgICAgICB8fCDQntGH0LrQuDp7cGxheWVyLnNjb3JlfVxyXG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwidGV4dF9ib2xkXCI+0J/RgNC+0LjQs9GA0YvRiDwvc3Bhbj5cclxuICAgICAgICAgICAgICAgIDwvaDI+XHJcbiAgICAgICAgICAgIHs6ZWxzZX1cclxuICAgICAgICAgICAgICAgIDxoMj57cGxheWVyLm5hbWV9IHx8INCe0YfQutC4OntwbGF5ZXIuc2NvcmV9PC9oMj5cclxuICAgICAgICAgICAgey9pZn1cclxuICAgICAgICAgICAgeyNlYWNoIHBsYXllci5jYXJkcyBhcyBjYXJkLCBpbmRleCAoaW5kZXgpfVxyXG4gICAgICAgICAgICAgICAgPGJ1dHRvbiB2YWx1ZT17Y2FyZC52YWx1ZX0gb246Y2xpY2s9e2FkZFNjb3JlUGxheWVyKHBsYXllciwgY2FyZC52YWx1ZSl9PntjYXJkLmNhcmR9PC9idXR0b24+XHJcbiAgICAgICAgICAgIHsvZWFjaH1cclxuICAgICAgICAgICAgPGJ1dHRvbiBvbjpjbGljaz17cmVzZXRTY29yZVBsYXllcihwbGF5ZXIpfT7QodCx0YDQvtGBPC9idXR0b24+XHJcbiAgICAgICAgICAgIDxidXR0b24gb246Y2xpY2s9e2FkZFNjb3JlUGxheWVyKHBsYXllciwgLTIwKX0+LTIwPC9idXR0b24+XHJcbiAgICAgICAgICAgIDxidXR0b24gb246Y2xpY2s9e2FkZFNjb3JlUGxheWVyKHBsYXllciwgLTQwKX0+LTQwPC9idXR0b24+XHJcbiAgICAgICAgPC9kaXY+XHJcbiAgICB7L2VhY2h9XHJcbjwvZGl2PlxyXG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBZUksS0FBSyxjQUFDLENBQUMsQUFDSCxLQUFLLENBQUUsR0FBRyxBQUNkLENBQUMsQUFFRCxVQUFVLGNBQUMsQ0FBQyxBQUNSLFdBQVcsQ0FBRSxJQUFJLEFBQ3JCLENBQUMsQUFFRCxXQUFXLGNBQUMsQ0FBQyxBQUNULEtBQUssQ0FBRSxHQUFHLENBQ1YsTUFBTSxDQUFFLENBQUMsQ0FBQyxJQUFJLENBQ2QsVUFBVSxDQUFFLE1BQU0sQUFDdEIsQ0FBQyxBQUVELGlCQUFpQixjQUFDLENBQUMsQUFDZixNQUFNLENBQUUsR0FBRyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQ3pCLGdCQUFnQixDQUFFLFNBQVMsQ0FDM0IsYUFBYSxDQUFFLEdBQUcsQ0FDbEIsYUFBYSxDQUFFLElBQUksQ0FDbkIsT0FBTyxDQUFFLElBQUksQUFDakIsQ0FBQyxBQUVELEVBQUUsY0FBQyxDQUFDLEFBQ0EsTUFBTSxDQUFFLENBQUMsQ0FDVCxhQUFhLENBQUUsSUFBSSxBQUN2QixDQUFDLEFBRUQsTUFBTSxjQUFDLENBQUMsQUFDSixNQUFNLENBQUUsR0FBRyxDQUFDLEdBQUcsQ0FDZixnQkFBZ0IsQ0FBRSxPQUFPLENBQ3pCLE1BQU0sQ0FBRSxHQUFHLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FDM0IsT0FBTyxDQUFFLEdBQUcsQ0FBQyxJQUFJLENBQ2pCLEtBQUssQ0FBRSxLQUFLLENBQ1osV0FBVyxDQUFFLElBQUksQ0FDakIsYUFBYSxDQUFFLEdBQUcsQ0FDbEIsVUFBVSxDQUFFLE1BQU0sQ0FDbEIsTUFBTSxDQUFFLE9BQU8sQ0FDZixVQUFVLENBQUUsSUFBSSxBQUNwQixDQUFDLEFBRUQsb0JBQU0sTUFBTSxBQUFDLENBQUMsQUFDVixnQkFBZ0IsQ0FBRSxPQUFPLENBQ3pCLFVBQVUsQ0FBRSxJQUFJLEFBQ3BCLENBQUMifQ== */";
    	append_dev(document.head, style);
    }

    function get_each_context_1$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	child_ctx[5] = i;
    	return child_ctx;
    }

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	child_ctx[5] = i;
    	return child_ctx;
    }

    // (71:12) {:else}
    function create_else_block$1(ctx) {
    	let h2;
    	let t0_value = /*player*/ ctx[3].name + "";
    	let t0;
    	let t1;
    	let t2_value = /*player*/ ctx[3].score + "";
    	let t2;

    	const block = {
    		c: function create() {
    			h2 = element("h2");
    			t0 = text(t0_value);
    			t1 = text(" || Очки:");
    			t2 = text(t2_value);
    			attr_dev(h2, "class", "svelte-4bf3n3");
    			add_location(h2, file$3, 71, 16, 1575);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h2, anchor);
    			append_dev(h2, t0);
    			append_dev(h2, t1);
    			append_dev(h2, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$players*/ 1 && t0_value !== (t0_value = /*player*/ ctx[3].name + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*$players*/ 1 && t2_value !== (t2_value = /*player*/ ctx[3].score + "")) set_data_dev(t2, t2_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(71:12) {:else}",
    		ctx
    	});

    	return block;
    }

    // (65:12) {#if player.score > 101}
    function create_if_block$2(ctx) {
    	let h2;
    	let t0_value = /*player*/ ctx[3].name + "";
    	let t0;
    	let t1;
    	let t2_value = /*player*/ ctx[3].score + "";
    	let t2;
    	let t3;
    	let span;

    	const block = {
    		c: function create() {
    			h2 = element("h2");
    			t0 = text(t0_value);
    			t1 = text("\r\n                    || Очки:");
    			t2 = text(t2_value);
    			t3 = space();
    			span = element("span");
    			span.textContent = "Проигрыш";
    			attr_dev(span, "class", "text_bold svelte-4bf3n3");
    			add_location(span, file$3, 68, 20, 1474);
    			attr_dev(h2, "class", "lose svelte-4bf3n3");
    			add_location(h2, file$3, 65, 16, 1356);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h2, anchor);
    			append_dev(h2, t0);
    			append_dev(h2, t1);
    			append_dev(h2, t2);
    			append_dev(h2, t3);
    			append_dev(h2, span);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$players*/ 1 && t0_value !== (t0_value = /*player*/ ctx[3].name + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*$players*/ 1 && t2_value !== (t2_value = /*player*/ ctx[3].score + "")) set_data_dev(t2, t2_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(65:12) {#if player.score > 101}",
    		ctx
    	});

    	return block;
    }

    // (74:12) {#each player.cards as card, index (index)}
    function create_each_block_1$1(key_1, ctx) {
    	let button;
    	let t_value = /*card*/ ctx[6].card + "";
    	let t;
    	let button_value_value;
    	let mounted;
    	let dispose;

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			button = element("button");
    			t = text(t_value);
    			button.value = button_value_value = /*card*/ ctx[6].value;
    			attr_dev(button, "class", "svelte-4bf3n3");
    			add_location(button, file$3, 74, 16, 1714);
    			this.first = button;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t);

    			if (!mounted) {
    				dispose = listen_dev(
    					button,
    					"click",
    					function () {
    						if (is_function(/*addScorePlayer*/ ctx[1](/*player*/ ctx[3], /*card*/ ctx[6].value))) /*addScorePlayer*/ ctx[1](/*player*/ ctx[3], /*card*/ ctx[6].value).apply(this, arguments);
    					},
    					false,
    					false,
    					false
    				);

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*$players*/ 1 && t_value !== (t_value = /*card*/ ctx[6].card + "")) set_data_dev(t, t_value);

    			if (dirty & /*$players*/ 1 && button_value_value !== (button_value_value = /*card*/ ctx[6].value)) {
    				prop_dev(button, "value", button_value_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$1.name,
    		type: "each",
    		source: "(74:12) {#each player.cards as card, index (index)}",
    		ctx
    	});

    	return block;
    }

    // (63:4) {#each $players as player, index (player)}
    function create_each_block$2(key_1, ctx) {
    	let div;
    	let t0;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let t1;
    	let button0;
    	let t3;
    	let button1;
    	let t5;
    	let button2;
    	let t7;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*player*/ ctx[3].score > 101) return create_if_block$2;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);
    	let each_value_1 = /*player*/ ctx[3].cards;
    	validate_each_argument(each_value_1);
    	const get_key = ctx => /*index*/ ctx[5];
    	validate_each_keys(ctx, each_value_1, get_each_context_1$1, get_key);

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		let child_ctx = get_each_context_1$1(ctx, each_value_1, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block_1$1(key, child_ctx));
    	}

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			div = element("div");
    			if_block.c();
    			t0 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t1 = space();
    			button0 = element("button");
    			button0.textContent = "Сброс";
    			t3 = space();
    			button1 = element("button");
    			button1.textContent = "-20";
    			t5 = space();
    			button2 = element("button");
    			button2.textContent = "-40";
    			t7 = space();
    			attr_dev(button0, "class", "svelte-4bf3n3");
    			add_location(button0, file$3, 76, 12, 1842);
    			attr_dev(button1, "class", "svelte-4bf3n3");
    			add_location(button1, file$3, 77, 12, 1914);
    			attr_dev(button2, "class", "svelte-4bf3n3");
    			add_location(button2, file$3, 78, 12, 1987);
    			attr_dev(div, "class", "player_interface svelte-4bf3n3");
    			add_location(div, file$3, 63, 8, 1270);
    			this.first = div;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if_block.m(div, null);
    			append_dev(div, t0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			append_dev(div, t1);
    			append_dev(div, button0);
    			append_dev(div, t3);
    			append_dev(div, button1);
    			append_dev(div, t5);
    			append_dev(div, button2);
    			append_dev(div, t7);

    			if (!mounted) {
    				dispose = [
    					listen_dev(
    						button0,
    						"click",
    						function () {
    							if (is_function(/*resetScorePlayer*/ ctx[2](/*player*/ ctx[3]))) /*resetScorePlayer*/ ctx[2](/*player*/ ctx[3]).apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					),
    					listen_dev(
    						button1,
    						"click",
    						function () {
    							if (is_function(/*addScorePlayer*/ ctx[1](/*player*/ ctx[3], -20))) /*addScorePlayer*/ ctx[1](/*player*/ ctx[3], -20).apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					),
    					listen_dev(
    						button2,
    						"click",
    						function () {
    							if (is_function(/*addScorePlayer*/ ctx[1](/*player*/ ctx[3], -40))) /*addScorePlayer*/ ctx[1](/*player*/ ctx[3], -40).apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div, t0);
    				}
    			}

    			if (dirty & /*$players, addScorePlayer*/ 3) {
    				const each_value_1 = /*player*/ ctx[3].cards;
    				validate_each_argument(each_value_1);
    				validate_each_keys(ctx, each_value_1, get_each_context_1$1, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value_1, each_1_lookup, div, destroy_block, create_each_block_1$1, t1, get_each_context_1$1);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_block.d();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}

    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(63:4) {#each $players as player, index (player)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let div;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let each_value = /*$players*/ ctx[0];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*player*/ ctx[3];
    	validate_each_keys(ctx, each_value, get_each_context$2, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$2(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block$2(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "game_field svelte-4bf3n3");
    			add_location(div, file$3, 61, 0, 1188);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*addScorePlayer, $players, resetScorePlayer*/ 7) {
    				const each_value = /*$players*/ ctx[0];
    				validate_each_argument(each_value);
    				validate_each_keys(ctx, each_value, get_each_context$2, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, div, destroy_block, create_each_block$2, null, get_each_context$2);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let $players;
    	validate_store(players, "players");
    	component_subscribe($$self, players, $$value => $$invalidate(0, $players = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("MultiPlayerGame", slots, []);

    	function addScorePlayer(player, score) {
    		player.addScore(score);
    		set_store_value(players, $players = [...$players], $players);
    	}

    	function resetScorePlayer(player) {
    		player.resetScore();
    		set_store_value(players, $players = [...$players], $players);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<MultiPlayerGame> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		players,
    		addScorePlayer,
    		resetScorePlayer,
    		$players
    	});

    	return [$players, addScorePlayer, resetScorePlayer];
    }

    class MultiPlayerGame extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		if (!document.getElementById("svelte-4bf3n3-style")) add_css$3();
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "MultiPlayerGame",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src/UI/multiPlayer/lobby.svelte generated by Svelte v3.29.0 */
    const file$4 = "src/UI/multiPlayer/lobby.svelte";

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	child_ctx[9] = i;
    	return child_ctx;
    }

    function get_each_context_1$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[10] = list[i];
    	child_ctx[9] = i;
    	return child_ctx;
    }

    // (17:16) {#if player.id === $players[0].id && SocketClient.socket.id === $players[0].id}
    function create_if_block$3(ctx) {
    	let button;
    	let t;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t = text("Старт");
    			button.disabled = /*isGameStart*/ ctx[0];
    			add_location(button, file$4, 17, 20, 467);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[4], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*isGameStart*/ 1) {
    				prop_dev(button, "disabled", /*isGameStart*/ ctx[0]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(17:16) {#if player.id === $players[0].id && SocketClient.socket.id === $players[0].id}",
    		ctx
    	});

    	return block;
    }

    // (15:12) {#each $players as player, index(player)}
    function create_each_block_1$2(key_1, ctx) {
    	let li;
    	let t0;
    	let t1_value = /*player*/ ctx[10].name + "";
    	let t1;
    	let t2;
    	let t3;
    	let hr;
    	let if_block = /*player*/ ctx[10].id === /*$players*/ ctx[1][0].id && socketClient.socket.id === /*$players*/ ctx[1][0].id && create_if_block$3(ctx);

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			li = element("li");
    			t0 = text("Name: ");
    			t1 = text(t1_value);
    			t2 = space();
    			if (if_block) if_block.c();
    			t3 = space();
    			hr = element("hr");
    			add_location(li, file$4, 15, 16, 322);
    			add_location(hr, file$4, 23, 16, 707);
    			this.first = li;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, t0);
    			append_dev(li, t1);
    			insert_dev(target, t2, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, hr, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$players*/ 2 && t1_value !== (t1_value = /*player*/ ctx[10].name + "")) set_data_dev(t1, t1_value);

    			if (/*player*/ ctx[10].id === /*$players*/ ctx[1][0].id && socketClient.socket.id === /*$players*/ ctx[1][0].id) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$3(ctx);
    					if_block.c();
    					if_block.m(t3.parentNode, t3);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			if (detaching) detach_dev(t2);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(hr);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$2.name,
    		type: "each",
    		source: "(15:12) {#each $players as player, index(player)}",
    		ctx
    	});

    	return block;
    }

    // (37:8) {#each $turns as turn, index(turn)}
    function create_each_block$3(key_1, ctx) {
    	let div;
    	let span0;
    	let t0;
    	let t1_value = /*turn*/ ctx[7].username + "";
    	let t1;
    	let t2;
    	let span1;
    	let t3;
    	let t4_value = /*turn*/ ctx[7].id + "";
    	let t4;
    	let t5;
    	let span2;
    	let t6;
    	let t7_value = /*turn*/ ctx[7].card + "";
    	let t7;
    	let t8;

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			div = element("div");
    			span0 = element("span");
    			t0 = text("name: ");
    			t1 = text(t1_value);
    			t2 = space();
    			span1 = element("span");
    			t3 = text("id: ");
    			t4 = text(t4_value);
    			t5 = space();
    			span2 = element("span");
    			t6 = text("card: ");
    			t7 = text(t7_value);
    			t8 = space();
    			add_location(span0, file$4, 38, 16, 1161);
    			add_location(span1, file$4, 39, 16, 1212);
    			add_location(span2, file$4, 40, 16, 1255);
    			add_location(div, file$4, 37, 12, 1139);
    			this.first = div;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span0);
    			append_dev(span0, t0);
    			append_dev(span0, t1);
    			append_dev(div, t2);
    			append_dev(div, span1);
    			append_dev(span1, t3);
    			append_dev(span1, t4);
    			append_dev(div, t5);
    			append_dev(div, span2);
    			append_dev(span2, t6);
    			append_dev(span2, t7);
    			append_dev(div, t8);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$turns*/ 8 && t1_value !== (t1_value = /*turn*/ ctx[7].username + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*$turns*/ 8 && t4_value !== (t4_value = /*turn*/ ctx[7].id + "")) set_data_dev(t4, t4_value);
    			if (dirty & /*$turns*/ 8 && t7_value !== (t7_value = /*turn*/ ctx[7].card + "")) set_data_dev(t7, t7_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$3.name,
    		type: "each",
    		source: "(37:8) {#each $turns as turn, index(turn)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let div2;
    	let div0;
    	let ul;
    	let each_blocks_1 = [];
    	let each0_lookup = new Map();
    	let t0;
    	let div1;
    	let button0;
    	let t1;
    	let button0_disabled_value;
    	let t2;
    	let button1;
    	let t3;
    	let button1_disabled_value;
    	let t4;
    	let each_blocks = [];
    	let each1_lookup = new Map();
    	let mounted;
    	let dispose;
    	let each_value_1 = /*$players*/ ctx[1];
    	validate_each_argument(each_value_1);
    	const get_key = ctx => /*player*/ ctx[10];
    	validate_each_keys(ctx, each_value_1, get_each_context_1$2, get_key);

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		let child_ctx = get_each_context_1$2(ctx, each_value_1, i);
    		let key = get_key(child_ctx);
    		each0_lookup.set(key, each_blocks_1[i] = create_each_block_1$2(key, child_ctx));
    	}

    	let each_value = /*$turns*/ ctx[3];
    	validate_each_argument(each_value);
    	const get_key_1 = ctx => /*turn*/ ctx[7];
    	validate_each_keys(ctx, each_value, get_each_context$3, get_key_1);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$3(ctx, each_value, i);
    		let key = get_key_1(child_ctx);
    		each1_lookup.set(key, each_blocks[i] = create_each_block$3(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			ul = element("ul");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t0 = space();
    			div1 = element("div");
    			button0 = element("button");
    			t1 = text("K");
    			t2 = space();
    			button1 = element("button");
    			t3 = text("T");
    			t4 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(ul, file$4, 13, 8, 247);
    			attr_dev(div0, "class", "users_list");
    			add_location(div0, file$4, 12, 4, 214);
    			button0.disabled = button0_disabled_value = /*$lastTurn*/ ctx[2].id !== socketClient.socket.id;
    			add_location(button0, file$4, 28, 8, 789);
    			button1.disabled = button1_disabled_value = /*$lastTurn*/ ctx[2].id !== socketClient.socket.id;
    			add_location(button1, file$4, 32, 8, 940);
    			attr_dev(div1, "class", "turns");
    			add_location(div1, file$4, 27, 4, 761);
    			attr_dev(div2, "class", "main_lobby");
    			add_location(div2, file$4, 11, 0, 185);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, ul);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(ul, null);
    			}

    			append_dev(div2, t0);
    			append_dev(div2, div1);
    			append_dev(div1, button0);
    			append_dev(button0, t1);
    			append_dev(div1, t2);
    			append_dev(div1, button1);
    			append_dev(button1, t3);
    			append_dev(div1, t4);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler_1*/ ctx[5], false, false, false),
    					listen_dev(button1, "click", /*click_handler_2*/ ctx[6], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*isGameStart, SocketClient, $players*/ 3) {
    				const each_value_1 = /*$players*/ ctx[1];
    				validate_each_argument(each_value_1);
    				validate_each_keys(ctx, each_value_1, get_each_context_1$2, get_key);
    				each_blocks_1 = update_keyed_each(each_blocks_1, dirty, get_key, 1, ctx, each_value_1, each0_lookup, ul, destroy_block, create_each_block_1$2, null, get_each_context_1$2);
    			}

    			if (dirty & /*$lastTurn*/ 4 && button0_disabled_value !== (button0_disabled_value = /*$lastTurn*/ ctx[2].id !== socketClient.socket.id)) {
    				prop_dev(button0, "disabled", button0_disabled_value);
    			}

    			if (dirty & /*$lastTurn*/ 4 && button1_disabled_value !== (button1_disabled_value = /*$lastTurn*/ ctx[2].id !== socketClient.socket.id)) {
    				prop_dev(button1, "disabled", button1_disabled_value);
    			}

    			if (dirty & /*$turns*/ 8) {
    				const each_value = /*$turns*/ ctx[3];
    				validate_each_argument(each_value);
    				validate_each_keys(ctx, each_value, get_each_context$3, get_key_1);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key_1, 1, ctx, each_value, each1_lookup, div1, destroy_block, create_each_block$3, null, get_each_context$3);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].d();
    			}

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}

    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let $players;
    	let $lastTurn;
    	let $turns;
    	validate_store(players, "players");
    	component_subscribe($$self, players, $$value => $$invalidate(1, $players = $$value));
    	validate_store(lastTurn, "lastTurn");
    	component_subscribe($$self, lastTurn, $$value => $$invalidate(2, $lastTurn = $$value));
    	validate_store(turns, "turns");
    	component_subscribe($$self, turns, $$value => $$invalidate(3, $turns = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Lobby", slots, []);
    	let isGameStart = false;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Lobby> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => {
    		socketClient.startGame();
    		$$invalidate(0, isGameStart = true);
    	};

    	const click_handler_1 = () => {
    		socketClient.turn("K");
    	};

    	const click_handler_2 = () => {
    		socketClient.turn("T");
    	};

    	$$self.$capture_state = () => ({
    		players,
    		turns,
    		lastTurn,
    		SocketClient: socketClient,
    		isGameStart,
    		$players,
    		$lastTurn,
    		$turns
    	});

    	$$self.$inject_state = $$props => {
    		if ("isGameStart" in $$props) $$invalidate(0, isGameStart = $$props.isGameStart);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		isGameStart,
    		$players,
    		$lastTurn,
    		$turns,
    		click_handler,
    		click_handler_1,
    		click_handler_2
    	];
    }

    class Lobby extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Lobby",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src/UI/Main.svelte generated by Svelte v3.29.0 */
    const file$5 = "src/UI/Main.svelte";

    function add_css$4() {
    	var style = element("style");
    	style.id = "svelte-n9ol5j-style";
    	style.textContent = ".title.svelte-n9ol5j{text-align:center;font-size:20px;font-weight:bold}button.svelte-n9ol5j{margin:5px auto;background-color:#007eff;border:1px solid #0400ffb0;padding:5px 10px;color:white;font-weight:bold;border-radius:5px;font-style:italic;cursor:pointer;transition:0.4s;display:block}button.svelte-n9ol5j:hover{background-color:#0014ff;transition:0.4s}.main_menu.svelte-n9ol5j{margin:0 auto;width:max-content;border:1px solid #00000014;border-radius:5px;background-color:#f1f1f196;padding:10px}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTWFpbi5zdmVsdGUiLCJzb3VyY2VzIjpbIk1haW4uc3ZlbHRlIl0sInNvdXJjZXNDb250ZW50IjpbIjxzY3JpcHQ+XG4gICAgaW1wb3J0IFNpbmdsZVBsYXllck1lbnUgZnJvbSBcIi4vc2luZ2xlUGxheWVyL1N0YXJ0TWVudS5zdmVsdGVcIjtcbiAgICBpbXBvcnQgU2luZ2xlUGxheWVyR2FtZSBmcm9tIFwiLi9zaW5nbGVQbGF5ZXIvU2luZ2xlUGxheWVyR2FtZS5zdmVsdGVcIjtcbiAgICBpbXBvcnQgTXVsdGlQbGF5ZXJNZW51IGZyb20gXCIuL211bHRpUGxheWVyL1N0YXJ0TWVudS5zdmVsdGVcIjtcbiAgICBpbXBvcnQgTXVsdGlQbGF5ZXJHYW1lIGZyb20gXCIuL211bHRpUGxheWVyL011bHRpUGxheWVyR2FtZS5zdmVsdGVcIjtcblxuICAgIGltcG9ydCBMb2JieSBmcm9tICcuL211bHRpUGxheWVyL2xvYmJ5LnN2ZWx0ZSdcblxuICAgIGxldCBzdGFydE1lbnUgPSB0cnVlOyAvLyB0cnVlXG5cbiAgICBsZXQgaXNTaG93U2luZ2xlUGxheWVyTWVudSA9IGZhbHNlO1xuICAgIGxldCBpc1N0YXJ0U2luZ2xlUGxheWVyID0gZmFsc2U7XG5cbiAgICBsZXQgaXNTaG93TXVsdGlQbGF5ZXJNZW51ID0gZmFsc2U7IC8vIGZhbHNlXG4gICAgbGV0IGlzU3RhcnRNdWx0aVBsYXllciA9IGZhbHNlO1xuICAgIGxldCBpc1N0YXJ0TG9iYnkgPSBmYWxzZTtcblxuICAgIGNsYXNzIFNpbmdsZVBsYXllciB7XG4gICAgICAgIHN0YXRpYyBzaG93U2luZ2xlUGxheWVyTWVudSgpIHtcbiAgICAgICAgICAgIGlzU2hvd1NpbmdsZVBsYXllck1lbnUgPSB0cnVlO1xuICAgICAgICAgICAgc3RhcnRNZW51ID0gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBzdGF0aWMgc3RhcnRTaW5nbGVQbGF5ZXIoKSB7XG4gICAgICAgICAgICBpc1N0YXJ0U2luZ2xlUGxheWVyID0gdHJ1ZTtcbiAgICAgICAgICAgIGlzU2hvd1NpbmdsZVBsYXllck1lbnUgPSBmYWxzZTtcbiAgICAgICAgICAgIHN0YXJ0TWVudSA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgY2xhc3MgTXVsdGlQbGF5ZXIge1xuICAgICAgICBzdGF0aWMgc2hvd011bHRpUGxheWVyTWVudSgpIHtcbiAgICAgICAgICAgIGlzU2hvd011bHRpUGxheWVyTWVudSA9IHRydWU7XG4gICAgICAgICAgICBzdGFydE1lbnUgPSBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHN0YXRpYyBzdGFydE11bHRpUGxheWVyKCkge1xuICAgICAgICAgICAgaXNTdGFydE11bHRpUGxheWVyID0gdHJ1ZTtcbiAgICAgICAgICAgIGlzU2hvd011bHRpUGxheWVyTWVudSA9IGZhbHNlO1xuICAgICAgICAgICAgc3RhcnRNZW51ID0gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBzdGF0aWMgc3RhcnRMb2JieSgpIHtcbiAgICAgICAgICAgIGlzU3RhcnRMb2JieSA9IHRydWU7XG4gICAgICAgICAgICBpc1Nob3dNdWx0aVBsYXllck1lbnUgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cbjwvc2NyaXB0PlxuXG48c3R5bGU+XG4gICAgLnRpdGxlIHtcbiAgICAgICAgdGV4dC1hbGlnbjogY2VudGVyO1xuICAgICAgICBmb250LXNpemU6IDIwcHg7XG4gICAgICAgIGZvbnQtd2VpZ2h0OiBib2xkO1xuICAgIH1cblxuICAgIGJ1dHRvbiB7XG4gICAgICAgIG1hcmdpbjogNXB4IGF1dG87XG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6ICMwMDdlZmY7XG4gICAgICAgIGJvcmRlcjogMXB4IHNvbGlkICMwNDAwZmZiMDtcbiAgICAgICAgcGFkZGluZzogNXB4IDEwcHg7XG4gICAgICAgIGNvbG9yOiB3aGl0ZTtcbiAgICAgICAgZm9udC13ZWlnaHQ6IGJvbGQ7XG4gICAgICAgIGJvcmRlci1yYWRpdXM6IDVweDtcbiAgICAgICAgZm9udC1zdHlsZTogaXRhbGljO1xuICAgICAgICBjdXJzb3I6IHBvaW50ZXI7XG4gICAgICAgIHRyYW5zaXRpb246IDAuNHM7XG4gICAgICAgIGRpc3BsYXk6IGJsb2NrO1xuICAgIH1cblxuICAgIGJ1dHRvbjpob3ZlciB7XG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6ICMwMDE0ZmY7XG4gICAgICAgIHRyYW5zaXRpb246IDAuNHM7XG4gICAgfVxuXG4gICAgLm1haW5fbWVudSB7XG4gICAgICAgIG1hcmdpbjogMCBhdXRvO1xuICAgICAgICB3aWR0aDogbWF4LWNvbnRlbnQ7XG4gICAgICAgIGJvcmRlcjogMXB4IHNvbGlkICMwMDAwMDAxNDtcbiAgICAgICAgYm9yZGVyLXJhZGl1czogNXB4O1xuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjZjFmMWYxOTY7XG4gICAgICAgIHBhZGRpbmc6IDEwcHg7XG4gICAgfVxuPC9zdHlsZT5cblxuPCEtLSDQodGC0LDRgNGC0L7QstC+0LUg0LzQtdC90Y4g0YEg0LLRi9Cx0L7RgNC+0Lwg0YDQtdC20LjQvNCwINC40LPRgNGLIC0tPlxueyNpZiBzdGFydE1lbnV9XG4gICAgPGRpdiBjbGFzcz1cIm1haW5fbWVudVwiPlxuICAgICAgICA8aDIgY2xhc3M9XCJ0aXRsZVwiPtCY0LPRgNCwIFwiMTAxXCI8L2gyPlxuICAgICAgICA8YnV0dG9uIG9uOmNsaWNrPXtTaW5nbGVQbGF5ZXIuc2hvd1NpbmdsZVBsYXllck1lbnV9PtCe0LTQuNC90L7Rh9C90LDRjyDQuNCz0YDQsDwvYnV0dG9uPlxuICAgICAgICA8YnV0dG9uIG9uOmNsaWNrPXtNdWx0aVBsYXllci5zaG93TXVsdGlQbGF5ZXJNZW51fT7QodC10YLQtdCy0LDRjyDQuNCz0YDQsDwvYnV0dG9uPlxuICAgIDwvZGl2Plxuey9pZn1cblxuPCEtLSDQntC00LjQvdC+0YfQvdGL0Lkg0YDQtdC20LjQvCDQuNCz0YDRiyAtLT5cbnsjaWYgaXNTaG93U2luZ2xlUGxheWVyTWVudX1cbiAgICA8U2luZ2xlUGxheWVyTWVudSBvbjpzdGFydD17U2luZ2xlUGxheWVyLnN0YXJ0U2luZ2xlUGxheWVyfS8+XG57L2lmfVxueyNpZiBpc1N0YXJ0U2luZ2xlUGxheWVyfVxuICAgIDxTaW5nbGVQbGF5ZXJHYW1lLz5cbnsvaWZ9XG5cbjwhLS0g0KHQtdGC0LXQstC+0Lkg0YDQtdC20LjQvCDQuNCz0YDRiyAtLT5cbjwhLS17I2lmIGlzU2hvd011bHRpUGxheWVyTWVudX0tLT5cbjwhLS0gICAgPE11bHRpUGxheWVyTWVudSBvbjpzdGFydD17TXVsdGlQbGF5ZXIuc3RhcnRNdWx0aVBsYXllcn0vPi0tPlxuPCEtLXsvaWZ9LS0+XG57I2lmIGlzU2hvd011bHRpUGxheWVyTWVudX1cbiAgICA8TXVsdGlQbGF5ZXJNZW51IG9uOmxvZ2luSW5Mb2JieT17TXVsdGlQbGF5ZXIuc3RhcnRMb2JieX0vPlxuey9pZn1cbnsjaWYgaXNTdGFydExvYmJ5fVxuICAgIDxMb2JieT48L0xvYmJ5Plxuey9pZn1cbjwhLS17I2lmIGlzU3RhcnRNdWx0aVBsYXllcn0tLT5cbjwhLS0gICAgPE11bHRpUGxheWVyR2FtZS8+LS0+XG48IS0tey9pZn0tLT5cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFrREksTUFBTSxjQUFDLENBQUMsQUFDSixVQUFVLENBQUUsTUFBTSxDQUNsQixTQUFTLENBQUUsSUFBSSxDQUNmLFdBQVcsQ0FBRSxJQUFJLEFBQ3JCLENBQUMsQUFFRCxNQUFNLGNBQUMsQ0FBQyxBQUNKLE1BQU0sQ0FBRSxHQUFHLENBQUMsSUFBSSxDQUNoQixnQkFBZ0IsQ0FBRSxPQUFPLENBQ3pCLE1BQU0sQ0FBRSxHQUFHLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FDM0IsT0FBTyxDQUFFLEdBQUcsQ0FBQyxJQUFJLENBQ2pCLEtBQUssQ0FBRSxLQUFLLENBQ1osV0FBVyxDQUFFLElBQUksQ0FDakIsYUFBYSxDQUFFLEdBQUcsQ0FDbEIsVUFBVSxDQUFFLE1BQU0sQ0FDbEIsTUFBTSxDQUFFLE9BQU8sQ0FDZixVQUFVLENBQUUsSUFBSSxDQUNoQixPQUFPLENBQUUsS0FBSyxBQUNsQixDQUFDLEFBRUQsb0JBQU0sTUFBTSxBQUFDLENBQUMsQUFDVixnQkFBZ0IsQ0FBRSxPQUFPLENBQ3pCLFVBQVUsQ0FBRSxJQUFJLEFBQ3BCLENBQUMsQUFFRCxVQUFVLGNBQUMsQ0FBQyxBQUNSLE1BQU0sQ0FBRSxDQUFDLENBQUMsSUFBSSxDQUNkLEtBQUssQ0FBRSxXQUFXLENBQ2xCLE1BQU0sQ0FBRSxHQUFHLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FDM0IsYUFBYSxDQUFFLEdBQUcsQ0FDbEIsZ0JBQWdCLENBQUUsU0FBUyxDQUMzQixPQUFPLENBQUUsSUFBSSxBQUNqQixDQUFDIn0= */";
    	append_dev(document.head, style);
    }

    // (87:0) {#if startMenu}
    function create_if_block_4(ctx) {
    	let div;
    	let h2;
    	let t1;
    	let button0;
    	let t3;
    	let button1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			h2 = element("h2");
    			h2.textContent = "Игра \"101\"";
    			t1 = space();
    			button0 = element("button");
    			button0.textContent = "Одиночная игра";
    			t3 = space();
    			button1 = element("button");
    			button1.textContent = "Сетевая игра";
    			attr_dev(h2, "class", "title svelte-n9ol5j");
    			add_location(h2, file$5, 88, 8, 2158);
    			attr_dev(button0, "class", "svelte-n9ol5j");
    			add_location(button0, file$5, 89, 8, 2200);
    			attr_dev(button1, "class", "svelte-n9ol5j");
    			add_location(button1, file$5, 90, 8, 2285);
    			attr_dev(div, "class", "main_menu svelte-n9ol5j");
    			add_location(div, file$5, 87, 4, 2126);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h2);
    			append_dev(div, t1);
    			append_dev(div, button0);
    			append_dev(div, t3);
    			append_dev(div, button1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*SinglePlayer*/ ctx[5].showSinglePlayerMenu, false, false, false),
    					listen_dev(button1, "click", /*MultiPlayer*/ ctx[6].showMultiPlayerMenu, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(87:0) {#if startMenu}",
    		ctx
    	});

    	return block;
    }

    // (96:0) {#if isShowSinglePlayerMenu}
    function create_if_block_3(ctx) {
    	let singleplayermenu;
    	let current;
    	singleplayermenu = new StartMenu({ $$inline: true });
    	singleplayermenu.$on("start", /*SinglePlayer*/ ctx[5].startSinglePlayer);

    	const block = {
    		c: function create() {
    			create_component(singleplayermenu.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(singleplayermenu, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(singleplayermenu.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(singleplayermenu.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(singleplayermenu, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(96:0) {#if isShowSinglePlayerMenu}",
    		ctx
    	});

    	return block;
    }

    // (99:0) {#if isStartSinglePlayer}
    function create_if_block_2(ctx) {
    	let singleplayergame;
    	let current;
    	singleplayergame = new SinglePlayerGame({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(singleplayergame.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(singleplayergame, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(singleplayergame.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(singleplayergame.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(singleplayergame, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(99:0) {#if isStartSinglePlayer}",
    		ctx
    	});

    	return block;
    }

    // (107:0) {#if isShowMultiPlayerMenu}
    function create_if_block_1(ctx) {
    	let multiplayermenu;
    	let current;
    	multiplayermenu = new StartMenu$1({ $$inline: true });
    	multiplayermenu.$on("loginInLobby", /*MultiPlayer*/ ctx[6].startLobby);

    	const block = {
    		c: function create() {
    			create_component(multiplayermenu.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(multiplayermenu, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(multiplayermenu.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(multiplayermenu.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(multiplayermenu, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(107:0) {#if isShowMultiPlayerMenu}",
    		ctx
    	});

    	return block;
    }

    // (110:0) {#if isStartLobby}
    function create_if_block$4(ctx) {
    	let lobby;
    	let current;
    	lobby = new Lobby({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(lobby.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(lobby, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(lobby.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(lobby.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(lobby, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(110:0) {#if isStartLobby}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let t0;
    	let t1;
    	let t2;
    	let t3;
    	let if_block4_anchor;
    	let current;
    	let if_block0 = /*startMenu*/ ctx[0] && create_if_block_4(ctx);
    	let if_block1 = /*isShowSinglePlayerMenu*/ ctx[1] && create_if_block_3(ctx);
    	let if_block2 = /*isStartSinglePlayer*/ ctx[2] && create_if_block_2(ctx);
    	let if_block3 = /*isShowMultiPlayerMenu*/ ctx[3] && create_if_block_1(ctx);
    	let if_block4 = /*isStartLobby*/ ctx[4] && create_if_block$4(ctx);

    	const block = {
    		c: function create() {
    			if (if_block0) if_block0.c();
    			t0 = space();
    			if (if_block1) if_block1.c();
    			t1 = space();
    			if (if_block2) if_block2.c();
    			t2 = space();
    			if (if_block3) if_block3.c();
    			t3 = space();
    			if (if_block4) if_block4.c();
    			if_block4_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block0) if_block0.m(target, anchor);
    			insert_dev(target, t0, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert_dev(target, t1, anchor);
    			if (if_block2) if_block2.m(target, anchor);
    			insert_dev(target, t2, anchor);
    			if (if_block3) if_block3.m(target, anchor);
    			insert_dev(target, t3, anchor);
    			if (if_block4) if_block4.m(target, anchor);
    			insert_dev(target, if_block4_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*startMenu*/ ctx[0]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_4(ctx);
    					if_block0.c();
    					if_block0.m(t0.parentNode, t0);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*isShowSinglePlayerMenu*/ ctx[1]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty & /*isShowSinglePlayerMenu*/ 2) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_3(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(t1.parentNode, t1);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			if (/*isStartSinglePlayer*/ ctx[2]) {
    				if (if_block2) {
    					if (dirty & /*isStartSinglePlayer*/ 4) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block_2(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(t2.parentNode, t2);
    				}
    			} else if (if_block2) {
    				group_outros();

    				transition_out(if_block2, 1, 1, () => {
    					if_block2 = null;
    				});

    				check_outros();
    			}

    			if (/*isShowMultiPlayerMenu*/ ctx[3]) {
    				if (if_block3) {
    					if_block3.p(ctx, dirty);

    					if (dirty & /*isShowMultiPlayerMenu*/ 8) {
    						transition_in(if_block3, 1);
    					}
    				} else {
    					if_block3 = create_if_block_1(ctx);
    					if_block3.c();
    					transition_in(if_block3, 1);
    					if_block3.m(t3.parentNode, t3);
    				}
    			} else if (if_block3) {
    				group_outros();

    				transition_out(if_block3, 1, 1, () => {
    					if_block3 = null;
    				});

    				check_outros();
    			}

    			if (/*isStartLobby*/ ctx[4]) {
    				if (if_block4) {
    					if (dirty & /*isStartLobby*/ 16) {
    						transition_in(if_block4, 1);
    					}
    				} else {
    					if_block4 = create_if_block$4(ctx);
    					if_block4.c();
    					transition_in(if_block4, 1);
    					if_block4.m(if_block4_anchor.parentNode, if_block4_anchor);
    				}
    			} else if (if_block4) {
    				group_outros();

    				transition_out(if_block4, 1, 1, () => {
    					if_block4 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block1);
    			transition_in(if_block2);
    			transition_in(if_block3);
    			transition_in(if_block4);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block1);
    			transition_out(if_block2);
    			transition_out(if_block3);
    			transition_out(if_block4);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach_dev(t0);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach_dev(t1);
    			if (if_block2) if_block2.d(detaching);
    			if (detaching) detach_dev(t2);
    			if (if_block3) if_block3.d(detaching);
    			if (detaching) detach_dev(t3);
    			if (if_block4) if_block4.d(detaching);
    			if (detaching) detach_dev(if_block4_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Main", slots, []);
    	let startMenu = true; // true
    	let isShowSinglePlayerMenu = false;
    	let isStartSinglePlayer = false;
    	let isShowMultiPlayerMenu = false; // false
    	let isStartMultiPlayer = false;
    	let isStartLobby = false;

    	class SinglePlayer {
    		static showSinglePlayerMenu() {
    			$$invalidate(1, isShowSinglePlayerMenu = true);
    			$$invalidate(0, startMenu = false);
    		}

    		static startSinglePlayer() {
    			$$invalidate(2, isStartSinglePlayer = true);
    			$$invalidate(1, isShowSinglePlayerMenu = false);
    			$$invalidate(0, startMenu = false);
    		}
    	}

    	class MultiPlayer {
    		static showMultiPlayerMenu() {
    			$$invalidate(3, isShowMultiPlayerMenu = true);
    			$$invalidate(0, startMenu = false);
    		}

    		static startMultiPlayer() {
    			isStartMultiPlayer = true;
    			$$invalidate(3, isShowMultiPlayerMenu = false);
    			$$invalidate(0, startMenu = false);
    		}

    		static startLobby() {
    			$$invalidate(4, isStartLobby = true);
    			$$invalidate(3, isShowMultiPlayerMenu = false);
    		}
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Main> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		SinglePlayerMenu: StartMenu,
    		SinglePlayerGame,
    		MultiPlayerMenu: StartMenu$1,
    		MultiPlayerGame,
    		Lobby,
    		startMenu,
    		isShowSinglePlayerMenu,
    		isStartSinglePlayer,
    		isShowMultiPlayerMenu,
    		isStartMultiPlayer,
    		isStartLobby,
    		SinglePlayer,
    		MultiPlayer
    	});

    	$$self.$inject_state = $$props => {
    		if ("startMenu" in $$props) $$invalidate(0, startMenu = $$props.startMenu);
    		if ("isShowSinglePlayerMenu" in $$props) $$invalidate(1, isShowSinglePlayerMenu = $$props.isShowSinglePlayerMenu);
    		if ("isStartSinglePlayer" in $$props) $$invalidate(2, isStartSinglePlayer = $$props.isStartSinglePlayer);
    		if ("isShowMultiPlayerMenu" in $$props) $$invalidate(3, isShowMultiPlayerMenu = $$props.isShowMultiPlayerMenu);
    		if ("isStartMultiPlayer" in $$props) isStartMultiPlayer = $$props.isStartMultiPlayer;
    		if ("isStartLobby" in $$props) $$invalidate(4, isStartLobby = $$props.isStartLobby);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		startMenu,
    		isShowSinglePlayerMenu,
    		isStartSinglePlayer,
    		isShowMultiPlayerMenu,
    		isStartLobby,
    		SinglePlayer,
    		MultiPlayer
    	];
    }

    class Main extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		if (!document.getElementById("svelte-n9ol5j-style")) add_css$4();
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Main",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    new Main({
        target: document.body,
    });

}(io));
