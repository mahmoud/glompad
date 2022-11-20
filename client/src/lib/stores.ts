import type {Writable, Readable} from 'svelte/store';
import { writable, readable, derived, get } from 'svelte/store';

import {createUrlStore} from './urlStore'

type PadState = {
    specValue: string,
    targetValue: string
}

class PadStore {
    constructor(
        public specValue: Writable<string> = writable(''),
        public specStatus: Writable<string> = writable(''),

        public targetValue: Writable<string> = writable(''),
        public targetStatus: Writable<string> = writable(''),

        public resultValue: Writable<string> = writable(''),
        public resultStatus: Writable<string> = writable(''),

        public stateStack: Writable<Array<PadState>> = writable([{'specValue': '', 'targetValue': ''}]),

    ) {};

    saveState() {
      const newState = {
        "specValue": get(this.specValue),
        "targetValue": get(this.targetValue),
      }
      const curStack = get(this.stateStack)
      if (curStack.length > 0 && shallowEqual(curStack[0], newState)) {
        return;
      }
      padStore.stateStack.update((curVal) => [newState, ...curVal])

      const urlParams = {
        "spec": newState.specValue,
        "target": newState.targetValue,
        "v": "1"
      }

      let new_url = new URL(window.location.toString())
      new_url.hash =  new URLSearchParams(Object.entries(urlParams)).toString();
  
      if (new_url.toString() != window.location.toString()) {
        urlStore.set(new_url.toString());
      }
    }
}

export const padStore = new PadStore();

export const urlStore = createUrlStore(window && window.location)

urlStore.subscribe((val) => {
    const hash = val.hash && val.hash.slice(1)
    const params = new URLSearchParams(hash);
    const newState: PadState = {
        "specValue": params.get('spec') || '',
        "targetValue": params.get('target') || ''}
    padStore.specValue.set(newState.specValue);
    padStore.targetValue.set(newState.targetValue);

    const curStack = get(padStore.stateStack)
    if (curStack.length == 0 || !shallowEqual(curStack[0], newState)) {
        padStore.stateStack.update((curVal) => [newState, ...curVal])
    }
});



function shallowEqual(o1, o2) {
    const entries1 = Object.entries(o1);
    const entries2 = Object.entries(o2);
    if (entries1.length !== entries2.length) {
      return false;
    }
    for (let i = 0; i < entries1.length; ++i) {
      // Keys
      if (entries1[i][0] !== entries2[i][0]) {
        return false;
      }
      // Values
      if (entries1[i][1] !== entries2[i][1]) {
        return false;
      }
    }
  
    return true;
  }

// State stack. If URL changes, compare to most recent on stack, and if not matching, add new state.