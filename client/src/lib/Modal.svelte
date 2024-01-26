<script lang="ts">
  import { createEventDispatcher, onDestroy } from "svelte";
  import Icon from "./Icon.svelte";

  const dispatch = createEventDispatcher();
  const close = () => dispatch("close");

  let modal;

  const handle_keydown = (e) => {
    if (e.key === "Escape") {
      close();
      return;
    }

    if (e.key === "Tab") {
      // trap focus
      const nodes: NodeList = modal.querySelectorAll("*");
      const tabbable = Array.from(nodes).filter(
        (n: HTMLElement) => n.tabIndex >= 0
      );

      let index = tabbable.indexOf(document.activeElement);
      if (index === -1 && e.shiftKey) index = 0;

      index += tabbable.length + (e.shiftKey ? -1 : 1);
      index %= tabbable.length;

      (tabbable[index] as HTMLElement)?.focus();
      e.preventDefault();
    }
  };

  const previously_focused =
    typeof document !== "undefined" && document.activeElement;

  if (previously_focused) {
    onDestroy(() => {
      (previously_focused as HTMLElement)?.focus();
    });
  }
</script>

<svelte:window on:keydown={handle_keydown} />

<div class="modal-background" on:keydown={close} on:click={close} />

<div class="modal" role="dialog" aria-modal="true" bind:this={modal}>
  <div class="header">
    <slot name="header" />
    <!-- svelte-ignore a11y-autofocus -->
    <button class="close" autofocus on:click={close}><Icon name="x" /></button>
  </div>
  <slot />
</div>

<style>
  .header {
    display: flex;
  }

  .close {
    align-self: right;
    margin: 5px 8px 0 auto;
  }

  .modal-background {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    z-index: 29;
  }

  .modal {
    position: absolute;
    left: 50%;
    top: 30%;
    width: calc(100vw - 4em);
    max-width: 32em;
    max-height: calc(100vh - 4em);
    overflow: auto;
    transform: translate(-50%, -50%);
    padding: 1em;
    border-radius: 0.2em;
    background: var(--gray-0);
    z-index: 39;
  }

  button {
    display: block;
  }
</style>
