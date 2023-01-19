import { writable } from "svelte/store";

export const toasts = writable([]);

export const addToast = (toast) => {
  // Create a unique ID so we can easily find/remove it
  // if it is dismissible/has a timeout.
  const id = Math.floor(Math.random() * 10000);

  // Setup some sensible defaults for a toast.
  const message : string = toast.message ?? ''; 
  // timeout based on 200wpm reading speed
  const default_timeout = (message.split(/s+/).length / (200/60)) * 1000 + 500;
  const default_dismissible = toast.timeout === 0 || toast.timeout > 5000 || (!toast.timeout && default_timeout > 5000);
  const defaults = {
    id,
    type: "info",
    dismissible: default_dismissible,
    timeout: default_timeout,
  };

  // Push the toast to the top of the list of toasts
  const full_toast = { ...defaults, ...toast };
  console.warn(full_toast);
  toasts.update((all) => [full_toast, ...all]);

  // If toast is dismissible, dismiss it after "timeout" amount of time.
  if (full_toast.timeout) {
    setTimeout(() => {
        console.warn(id);
        dismissToast(id);
    }, full_toast.timeout);
  }
};

export const dismissToast = (id) => {
  toasts.update((all) => all.filter((t) => t.id !== id));
};
