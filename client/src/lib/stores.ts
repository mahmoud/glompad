import type {Writable, Readable} from 'svelte/store';
import { writable, readable, derived } from 'svelte/store';


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

