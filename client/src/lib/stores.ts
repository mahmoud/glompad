import { derived, type Readable, type Unsubscriber, type Writable } from 'svelte/store';
import { writable, get } from 'svelte/store';

import { createMediaStore } from 'svelte-media-queries'

import { createUrlStore } from './urlStore'
export { darkModeStore } from './darkModeStore'

class PadState {
  constructor(
    public specValue: string = '',
    public targetValue: string = '',
    public scopeValue: string = '',
    public runID: number = 0,
  ) { };
}

type StatusKindValue = 'success' | 'error' | 'pending';

class InputStatus {
  constructor(
    public kind: StatusKindValue = 'success',
    public run_id: number = 0,
    public created_at: string = null,
    public subtitle: string = '',
    public detail: string = '',
    public timing: number = -0.0,
  ) {
    this.created_at = this.created_at ?? new Date().toISOString();
  };
}

function override<T>(template: T, overrides: Partial<T>): T {
  return { ...template, ...overrides };
}

// NB: there's an extra song and dance to getting data out of pyodide, 
// as most of the objects have to be wrapped in pyproxy objects. 
// see the other half of the dance in glompad.py
function deproxyWritable(initial: any) {
  const store = writable(initial);

  return {
    ...store,
    setProxy: (proxy) => {
      const copy = proxy.toJs({ dict_converter: Object.fromEntries });
      return store.set(copy);
    }
  }
}

export const isValidURL = (text: string) => {
  try {
    return !!(text.match(/https?:\/\/.+[./].+/) && new URL(text));
  } catch (e) {
    return false;
  }
};


class PadStore {
  constructor(
    public specValue: Writable<string> = writable(''),
    public specStatus: Writable<InputStatus> = deproxyWritable(new InputStatus()),

    public scopeValue: Writable<string> = writable(''),
    public scopeStatus: Writable<InputStatus> = deproxyWritable(new InputStatus()),

    public targetValue: Writable<string> = writable(''),
    public targetStatus: Writable<InputStatus> = deproxyWritable(new InputStatus()),
    public targetURLValue: Writable<string> = writable(''),
    public targetDestStore: Writable<Writable<string>> = writable(null),
    public targetFetchStatus: Writable<InputStatus> = writable(new InputStatus()),

    public resultValue: Writable<string> = writable(''),
    public resultStatus: Writable<InputStatus> = deproxyWritable(new InputStatus()),

    public stateStack: Writable<Array<PadState>> = writable([new PadState()]),
    public curRunID: Writable<number> = writable(0),

    public enableScope: Writable<boolean | null> = writable(null),
    public enableAutoformat: Writable<boolean> = writable(false),
    public enableDebug: Writable<boolean> = writable(false),

    // this hack is necessary because otherwise we can't actually tell the difference 
    // between a write to the targetValue from an example click or URL modification 
    // versus a write from the target data preview fetch.
    public settlingHref: Writable<boolean> = writable(false),

    public targetChanged: Readable<boolean> = null,
    public specChanged: Readable<boolean> = null,
    public scopeChanged: Readable<boolean> = null,
  ) {
    this.targetDestStore.set(targetValue);

    // doesn't infinite loop bc stateStack shortcircuits when the state is unchanged
    this.stateStack.subscribe(this.executeGlom);

    this.targetChanged = derived([this.targetValue, this.stateStack],
      ([tv, stateStack]) => {
        return tv.trim() != stateStack[0].targetValue.trim();
      })

    this.specChanged = derived([this.specValue, this.stateStack],
      ([sv, stateStack]) => {
        return sv != stateStack[0].specValue;
      })

    this.scopeChanged = derived([this.scopeValue, this.stateStack],
      ([sv, stateStack]) => {
        return sv != stateStack[0].scopeValue;
      })
  };

  deriveAll(): Readable<unknown> {
    let storeList = Object.values(this);
    //@ts-ignore (this is only used for debug)
    return derived(storeList, (...$vals) => [...$vals])
  }

  toJson(maxLength: number = 60) {
    let copy: any = {};
    for (const [key, store] of Object.entries(this)) {
      let val = get(store);
      if (typeof val == 'string') {
        val = val.length < maxLength ? val : val.substring(0, maxLength) + '...'
      }
      copy[key] = val;
    }
    copy.stateStackLength = copy.stateStack.length;
    delete copy.stateStack;

    return JSON.stringify(copy, undefined, 2).trim();
  }

  saveState() {
    const targetURLParam = get(this.targetURLValue) && !get(this.settlingHref) ? get(this.targetURLValue) : get(this.targetValue);
    const newState: Partial<PadState> = {
      "specValue": get(this.specValue),
      "scopeValue": get(this.scopeValue),
      "targetValue": get(this.targetValue),
    }
    if (this.stateValueCurrent(newState)) {
      return;
    }
    newState['runID'] = get(this.curRunID)
    padStore.stateStack.update((curVal) => [newState as PadState, ...curVal])

    const urlParams = {
      "spec": newState.specValue,
      "target": targetURLParam,
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
      this.executeGlom();
    }
  }

  stateValueCurrent(state: Partial<PadState>) {
    const newState = { ...state }
    delete newState['runID']
    const curState = { ...get(this.stateStack)[0] }
    delete curState['runID']

    return shallowEqual(curState, newState)
  }

  executeGlom() {
    if (!window.pyg) {
      console.log("no pyscript yet");
      return;
    }

    // TODO: option to only save successful specs?
    // Right now (2022-12-15) glompad.run expects to read from stateStack
    padStore.saveState();
    window.pyg.get("run")();
    if (get(padStore.enableAutoformat)) {
      // TODO: hack in case the spec/scope/target got reformatted updated
      padStore.saveState();
    }
  };
}

export const padStore = new PadStore();

export const urlStore = createUrlStore(window && window.location)

export const largeScreenStore = createMediaStore('(min-width: 500px');


urlStore.subscribe((val: URL) => {
  if (window && window.location.href != val.toString()) {
    window.location.href = val.toString();
    // return;
  }

  const hash = val.hash && val.hash.slice(1)
  const params = new URLSearchParams(hash);
  const newState: Partial<PadState> = {
    "specValue": params.get('spec') || '',
    "targetValue": params.get('target') || '',
    "scopeValue": params.get('scope') || '',
  }
  padStore.settlingHref.set(true)
  try {
    padStore.specValue.set(newState.specValue);
    padStore.scopeValue.set(newState.scopeValue);
    padStore.targetValue.set(newState.targetValue);

    if (!!newState.scopeValue && get(padStore.enableScope) === null) {
      padStore.enableScope.set(true);
    }
    padStore.saveState()
  } finally {
    padStore.settlingHref.set(false)
  }
});


function shallowEqual(o1: any, o2: any): boolean {
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

