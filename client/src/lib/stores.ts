import type {Writable, Readable} from 'svelte/store';
import { writable, readable, derived } from 'svelte/store';

import {createUrlStore} from './urlStore'

class PadStore {
    constructor(
        public specValue: Writable<string> = writable(''),
        public specStatus: Writable<string> = writable(''), // TODO: derived based on load?

        public targetValue: Writable<string> = writable("{'a': {'b': {'c': 'd'}}}"),
        public targetStatus: Writable<string> = writable(''),

        public resultValue: Writable<string> = writable(''), // TODO: derived via glom call?
        public resultStatus: Writable<string> = writable(''),


    ) {}
}

export const padStore = new PadStore();

export const urlStore = createUrlStore(window && window.location) // TODO: handle initial state?

urlStore.subscribe((val) => {
    const hash = val.hash && val.hash.slice(1)
    const params = new URLSearchParams(hash);
    padStore.specValue.set(params.get('spec'));
    padStore.targetValue.set(params.get('target'));

    console.log(params.get('spec'), params.get('target'))
});
