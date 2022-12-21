<script>
  import Icon from "./Icon.svelte";
  import StatusBadge from "./StatusBadge.svelte";

  let classes = "";
  export { classes as class };
  export let status;
  export let title;
  export let collapsed = false;
  export let min_height = null;
  export let flex_grow = null;
  const orig_flex_grow = flex_grow;

  let content_class = "";

  const toggle = () => {
    collapsed = !collapsed;
  };

  const expand = () => {
    if (collapsed) {
      collapsed = false;
    }
  };

  $: {
    content_class = collapsed ? "collapsed-content" : "";
    flex_grow = collapsed ? 0 : orig_flex_grow;
  }
</script>

<div
  class="panel {classes} {collapsed ? 'collapsed' : ''}"
  style:min-height={min_height}
  style:flex-grow={flex_grow}
>
  <div class="panel-label">
    <h3 class="panel-label-text" on:click={expand} on:keydown={expand}>
      <span
        class="collapser"
        on:click|stopPropagation={toggle}
        on:keydown|stopPropagation={toggle}
      >
        {#if !collapsed}
          <Icon name="chevron-down" />
        {:else}
          <Icon name="chevron-right" />
        {/if}
      </span>
      {title}
    </h3>
    <StatusBadge {status} />
  </div>
  <div class="panel-content {content_class}">
    <slot />
  </div>
</div>

<style>
  .panel {
    overflow: hidden;
    padding-bottom: 3px;
    margin-bottom: 15px;
    display: flex;
    flex-direction: column;
    flex: 1 1 auto;
    min-height: 30px;
    max-width: 1200px;
    width: 100%;
    flex-basis: 10%;
  }

  div.panel.collapsed {
    flex: 0 1 fit-content;
  }

  .collapser {
    cursor: pointer;
  }

  .collapsed-content {
    display: none;
    height: 0;
  }

  .panel-label {
    display: flex;
    margin-bottom: 6px;
  }

  .panel-label-text {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 0.95rem;
    border-bottom: 1px solid var(--gray-3);
    text-transform: uppercase;
    color: var(--gray-5);
    padding-bottom: 3px;
    user-select: none;
    margin-right: auto;
    flex: 1;
  }

  .panel-content {
    flex: 1;
    min-height: 0;
  }

  .panel-content > :global(:first-child) {
    height: 100%;
  }
</style>
