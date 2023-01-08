import { derived } from 'svelte/store'

// from https://git.learnjsthehardway.com/learn-javascript-the-hard-way/bandolier-template/src/branch/main/client/helpers.js
export const defer = (debug = "") => {
    let res;
    let rej;

    let promise = new Promise((resolve, reject) => {
        if (debug) {
            res = (result) => {
                console.log("resolved defer", debug);
                resolve(result);
            }

            rej = (error) => {
                console.log("REJECT defer", debug);
                reject(error);
            }
        } else {
            res = resolve;
            rej = reject;
        }
    });

    // lol typescript
    (promise as any).resolve = res;
    (promise as any).reject = rej;

    return promise;
}

export function asyncDerived(
    stores: Parameters<typeof derived>[0],
    callback: Function,
    initial_value: unknown): ReturnType<typeof derived> {
        
    let previous = 0

    return derived(stores, ($stores, set) => {
        const start = Date.now()
        Promise.resolve(callback($stores)).then(value => {
            if (start > previous) {
                previous = start
                set(value)
            }
        })
    }, initial_value)
}
