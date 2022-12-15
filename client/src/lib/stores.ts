import type {Writable, Readable} from 'svelte/store';
import { writable, readable, derived, get } from 'svelte/store';

import { createMediaStore } from 'svelte-media-queries'

import {createUrlStore} from './urlStore'
export {darkModeStore} from './darkModeStore'

class PadState {
    constructor( 
      public specValue: string = '',
      public targetValue: string = '',
      public scopeValue: string = '',
    ) {};
}

class InputStatus {
  constructor(
    public title: string = 'OK',
    public subtitle: string = '',
    public detail: string = '',
    public timing: number = -0.0
  ) {};
}


// NB: there's an extra song and dance to getting data out of pyodide, 
// as most of the objects have to be wrapped in pyproxy objects. 
// see the other half of the dance in glompad.py
function deproxyWritable(initial) {
  const store = writable(initial);

  return {
    ...store,
    setProxy: (proxy) => {
      const copy = proxy.toJs({dict_converter: Object.fromEntries});
      return store.set(copy);
    }
  }
}


class PadStore {
    constructor(
        public specValue: Writable<string> = writable(''),
        public specStatus: Writable<InputStatus> = deproxyWritable(new InputStatus()),

        public scopeValue: Writable<string> = writable(''),
        public scopeStatus: Writable<InputStatus> = deproxyWritable(new InputStatus()),

        public targetValue: Writable<string> = writable(''),
        public targetStatus: Writable<InputStatus> = deproxyWritable(new InputStatus()),

        public resultValue: Writable<string> = writable(''),
        public resultStatus: Writable<InputStatus> = deproxyWritable(new InputStatus()),

        public stateStack: Writable<Array<PadState>> = writable([new PadState()]),

        public enableScope: Writable<boolean | null> = writable(null),
        public enableAutoformat: Writable<boolean> = writable(false),

    ) {};

    saveState() {
      const newState = {
        "specValue": get(this.specValue),
        "scopeValue": get(this.scopeValue),
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
      }
      if (newState.scopeValue) {
        urlParams['scope'] = newState.scopeValue;
      }
      urlParams['v'] = '1';

      let new_url = new URL(window.location.toString())
      new_url.hash = new URLSearchParams(Object.entries(urlParams)).toString();
  
      if (new_url.toString() != window.location.toString()) {
        console.log(new_url.toString())
        urlStore.set(new_url.toString());
      }
    }

    executeGlom() {
      if (!window.pyg) {
        console.log("no pyscript yet");
        return;
      }

      padStore.saveState(); // TODO: option to only save successful specs?
      window.pyg.get("run_click")();

      if (get(this.enableAutoformat)) {
        window.console.log("autoformatting");
        const autoformat = window.pyg.get("autoformat");
        const specFormatted = autoformat(get(this.specValue));
        this.specValue.set(specFormatted);
        const targetFormatted = autoformat(get(this.targetValue));
        this.targetValue.set(targetFormatted);
      }
    };
}

export const padStore = new PadStore();

export const urlStore = createUrlStore(window && window.location)

export const largeScreenStore = createMediaStore('(min-width: 500px');

urlStore.subscribe((val) => {
    const hash = val.hash && val.hash.slice(1)
    const params = new URLSearchParams(hash);
    const newState: PadState = {
        "specValue": params.get('spec') || '',
        "targetValue": params.get('target') || '',
        "scopeValue": params.get('scope') || '',
      }
    padStore.specValue.set(newState.specValue);
    padStore.scopeValue.set(newState.scopeValue);
    padStore.targetValue.set(newState.targetValue);

    if (!!newState.scopeValue && get(padStore.enableScope) === null) {
      padStore.enableScope.set(true);
    }

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

