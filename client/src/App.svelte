<script lang="ts">
  import Drawer from "./lib/Drawer.svelte";
  import Icon from "./lib/Icon.svelte";
  import Pad from "./lib/Pad.svelte";

  let drawer;
  let innerWidth = 0;
</script>

<svelte:window bind:innerWidth />

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
<div>
  <py-repl id="bottom-repl" auto-generate="true" />
</div>

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
  }

  .box {
    display: flex;
    flex-direction: column;
  }

  :global(.glompad) {
    margin: 0 0.5rem;
    padding: 0.5rem;
    background: var(--gray-1);
    flex: 1;
  }

  .header {
    height: 48px;
    padding-left: 10px;
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
