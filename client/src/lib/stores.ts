import type {Writable, Readable} from 'svelte/store';
import { writable, readable, derived } from 'svelte/store';


class PadStore {
    constructor(
        public specValue: Writable<string> = writable(''),
        public targetValue: Writable<string> = writable(''),
        public resultValue: Readable<string> = readable(''), // TODO: derived via glom call?
    ) {}
}

export const padStore = new PadStore();