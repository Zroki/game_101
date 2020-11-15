import {writable} from 'svelte/store';

export let players = writable([]);
export let turns = writable([]);
export let lastTurn = writable({});