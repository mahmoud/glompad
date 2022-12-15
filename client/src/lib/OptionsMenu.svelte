<script>
  import tooltip from "./actions/tooltip";
  import Icon from "./Icon.svelte";
  import { padStore, darkModeStore } from "./stores";

  export let domNode = null;
  export let withTitle = true;
  let { enableAutoformat, enableScope } = padStore;
</script>

<div id="optionsMenu" bind:this={domNode}>
  {#if withTitle}
    <p class="menu-title">Options</p>
  {/if}
  <div class="option" id="autoformat-item">
    <label
      use:tooltip={{
        content:
          "Automatically format spec and target on execution using the black autoformatter. Also use black for result formatting instead of pprint.",
        placement: "right",
        delay: [400, 0],
      }}
    >
      <input type="checkbox" bind:checked={$enableAutoformat} />
      Autoformat
    </label>
  </div>
  <div class="option" id="scope-item">
    <label
      use:tooltip={{
        content: "Show input for glom scope, for advanced glom usage.",
        placement: "right",
        delay: [400, 0],
      }}
    >
      <input type="checkbox" bind:checked={$enableScope} />

      Enable glom scope
    </label>
    <!-- svelte-ignore security-anchor-rel-noreferrer -->
    <a
      target="_blank"
      href="https://glom.readthedocs.io/en/latest/api.html#the-glom-scope"
      ><Icon name="help-circle" /></a
    >
  </div>
  <div class="option" id="darkmode-item">
    <label
      use:tooltip={{
        content: "Override browser/OS preference and force dark mode.",
        placement: "right",
        delay: [400, 0],
      }}
    >
      <input type="checkbox" bind:checked={$darkModeStore} />
      Dark mode</label
    >
  </div>
</div>

<style>
  .menu-title {
    border-bottom: 1px solid var(--gray-3);
    margin-bottom: 6px;
  }

  .option > * {
    cursor: pointer;
  }
</style>
