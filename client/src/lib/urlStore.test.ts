import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { get } from 'svelte/store';
import { createUrlStore } from './urlStore';

describe('createUrlStore', () => {
  let originalPushState: typeof history.pushState;
  let originalReplaceState: typeof history.replaceState;

  beforeEach(() => {
    // Capture the real history methods before createUrlStore patches them
    originalPushState = history.pushState;
    originalReplaceState = history.replaceState;
  });

  afterEach(() => {
    // Restore original history methods to avoid cross-test pollution
    history.pushState = originalPushState;
    history.replaceState = originalReplaceState;
  });

  it('subscribes and returns current URL as a URL object', () => {
    const store = createUrlStore(undefined);
    let value: URL | undefined;
    const unsub = store.subscribe!((v: URL) => { value = v; });
    expect(value).toBeInstanceOf(URL);
    expect(value!.href).toBe(window.location.href);
    unsub();
  });

  it('history.pushState triggers store update with new URL', () => {
    const store = createUrlStore(undefined);
    let value: URL | undefined;
    const unsub = store.subscribe!((v: URL) => { value = v; });

    history.pushState({}, '', '/foo');
    expect(value).toBeInstanceOf(URL);
    expect(value!.pathname).toBe('/foo');
    unsub();
  });

  it('history.replaceState triggers store update with new URL', () => {
    const store = createUrlStore(undefined);
    let value: URL | undefined;
    const unsub = store.subscribe!((v: URL) => { value = v; });

    history.replaceState({}, '', '/bar');
    expect(value).toBeInstanceOf(URL);
    expect(value!.pathname).toBe('/bar');
    unsub();
  });

  it('hash changes via pushState are reflected in store', () => {
    const store = createUrlStore(undefined);
    let value: URL | undefined;
    const unsub = store.subscribe!((v: URL) => { value = v; });

    history.pushState({}, '', '#section-1');
    expect(value!.hash).toBe('#section-1');

    history.pushState({}, '', '#section-2');
    expect(value!.hash).toBe('#section-2');
    unsub();
  });

  it('set() directly updates the internal href value', () => {
    const store = createUrlStore(undefined);
    let value: URL | undefined;
    const unsub = store.subscribe!((v: URL) => { value = v; });

    store.set!('https://example.com/test');
    expect(value).toBeInstanceOf(URL);
    expect(value!.href).toBe('https://example.com/test');
    unsub();
  });

  it('multiple subscribers all receive updates', () => {
    const store = createUrlStore(undefined);
    let value1: URL | undefined;
    let value2: URL | undefined;
    const unsub1 = store.subscribe!((v: URL) => { value1 = v; });
    const unsub2 = store.subscribe!((v: URL) => { value2 = v; });

    history.pushState({}, '', '/multi');
    expect(value1!.pathname).toBe('/multi');
    expect(value2!.pathname).toBe('/multi');
    unsub1();
    unsub2();
  });

  it('URL with hash params (spec, target, scope) is correctly parsed', () => {
    const store = createUrlStore(undefined);
    let value: URL | undefined;
    const unsub = store.subscribe!((v: URL) => { value = v; });

    const hash = '#spec=T(int)&target=%7B%22a%22%3A1%7D&scope=deep';
    history.pushState({}, '', '/' + hash);

    expect(value!.hash).toBe(hash);
    const params = new URLSearchParams(value!.hash.slice(1));
    expect(params.get('spec')).toBe('T(int)');
    expect(params.get('target')).toBe('{"a":1}');
    expect(params.get('scope')).toBe('deep');
    unsub();
  });
});
