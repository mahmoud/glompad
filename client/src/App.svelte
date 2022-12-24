<script lang="ts">
  import Drawer from "./lib/Drawer.svelte";
  import Icon from "./lib/Icon.svelte";
  import Pad from "./lib/Pad.svelte";
  import tooltip from "./lib/actions/tooltip";
  import copyText from "./lib/actions/copyText";

  import { padStore } from "./lib/stores";
  import { onMount } from "svelte";

  const { executeGlom, curRunID, specStatus, enableDebug } = padStore;

  let drawer;
  let innerWidth = 0;

  let pageTitle = "glompad";

  const fmtRelTime = (status_created_at): string => {
    const last_run_dt = new Date(status_created_at);
    const delta = (new Date().valueOf() - last_run_dt.valueOf()) / 1000;
    let ret: string;

    if (delta < 60) {
      ret = "just now";
    } else if (delta < 120) {
      ret = "about a minute ago";
    } else if (delta < 2700) {
      ret = (delta / 60).toFixed().toString() + " minutes ago";
    } else if (delta < 5400) {
      ret = "about an hour ago";
    } else if (delta < 86400) {
      ret = "about " + (delta / 3600).toFixed().toString() + " hours ago";
    } else {
      ret = "on " + last_run_dt.toLocaleString();
    }
    return ret;
  };

  let last_status_time = null;

  onMount(() => {
    const interval = setInterval(() => {
      if ($curRunID > 0) {
        last_status_time = $specStatus.created_at;
      }
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  });

  $: {
    pageTitle = $curRunID ? `[${$curRunID}] glompad` : "glompad";
  }
</script>

<svelte:window bind:innerWidth />

<svelte:head>
  <title>{pageTitle}</title>
</svelte:head>

<div id="container">
  <Drawer bind:this={drawer} />

  <div class="box header">
    <h1 id="title">
      <div
        class="menu-icon-bg"
        on:click|stopPropagation={drawer.toggleOpen}
        on:keydown|stopPropagation={drawer.toggleOpen}
      >
        <Icon name="menu" stroke="currentColor" />
      </div>

      <a href="{import.meta.env.BASE_URL}#"> glompad </a>
    </h1>
    <div id="pad-actions">
      {#if last_status_time}
        <span id="last-run">(last run {fmtRelTime(last_status_time)})</span>
      {/if}
      <button
        id="run-button"
        on:click={executeGlom}
        use:tooltip={{
          content: "Run (or Ctrl-Enter via keyboard)",
          placement: "bottom",
          delay: [400, 0],
        }}><Icon name="play" /></button
      >
      <button
        class="link-button"
        use:tooltip={{
          content: "Copy shareable link to clipboard",
          placement: "bottom",
          delay: [400, 0],
        }}
        use:copyText={() => window.location.href}
      >
        <Icon name="link" />
      </button>
    </div>
  </div>

  <Pad class="box glompad" />

  <div class="box footer">
    <!-- svelte-ignore security-anchor-rel-noreferrer -->
    <a href="https://github.com/mahmoud/glom" target="_blank"
      ><Icon name="github" /></a
    >
    <!-- svelte-ignore security-anchor-rel-noreferrer -->
    <a href="https://glom.readthedocs.io/en/latest/" target="_blank"
      ><Icon name="book-open" /></a
    >
  </div>
</div>
{#if $enableDebug}
  <div style:max-width="80vw">
    <h3>REPL</h3>
    <py-repl id="bottom-repl" auto-generate="true" />
  </div>
{/if}

<style>
  h1 {
    user-select: none;
  }

  #title * {
    text-decoration: none;
    color: var(--primary-color-8);
    font-weight: 500;
    font: monospace;
    letter-spacing: -1.5px;
  }

  .menu-icon-bg :global(*) {
    margin: 0 auto;
  }

  .menu-icon-bg {
    cursor: pointer;
    border-radius: 50%;
    background: var(--primary-color-2);
    color: var(--primary-color-8);
    width: 38px;
    height: 36px;
    top: 11px;
    display: inline-block;
    vertical-align: middle;
    overflow: hidden;
    text-align: center;
    text-decoration: none;
    transition: color 0.15s ease, background 0.15s ease;
    font-size: 70%;
    padding: 4px 2px;
  }

  .menu-icon-bg:hover {
    background: var(--primary-color-3);
  }

  #container {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 100%;
    max-height: calc(100vh - 88px);
  }

  #last-run {
    color: var(--gray-4);
  }

  .box {
    display: flex;
  }

  :global(.glompad) {
    margin: 0 0.5rem;
    padding: 0.5rem;
    background: var(--gray-0);
    flex: 1;
  }

  .header {
    height: 48px;
    padding-left: 10px;
  }

  #pad-actions {
    align-self: right;
    margin: 12px 18px 0 auto;
    vertical-align: baseline;
  }

  #pad-actions button {
    cursor: pointer;
    background: var(--gray-1);
    color: var(--gray-5);
    border: 1px solid var(--gray-5);
    border-radius: 3px;
    height: 34px;
    width: 34px;
  }

  #pad-actions button:hover {
    background: var(--gray-0);
    border-color: var(--primary-color-8);
    color: var(--primary-color-8);
  }

  #pad-actions #run-button {
    width: 100px;
  }

  .footer {
    height: 40px;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    padding-top: 10px;
  }

  .footer * {
    margin: 0 5px 0 5px;
  }
</style>
