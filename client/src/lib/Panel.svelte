<script>
    let classes = "";
    export {classes as class};
    export let status = null, title;
</script>

<div class="panel {classes}">
    <div class="panel-label">
        <h3 class="panel-label-text">{title}</h3>
        {#if status}
            <div class="panel-status-badge">{status}</div>
        {/if}
    </div>
    <slot></slot>
</div>        


<style>
    .panel {
        overflow: hidden;
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
      border-bottom: 1px solid silver;
      text-transform: uppercase;
      color: #555;
      padding-bottom: 3px;
      user-select: none;
      margin-right: auto;
      flex: 1;
    }
    
    .panel-status-badge {
      background: silver;
      display: inline-flexbox;
      margin-left: auto;
      font-size: .85rem;
      padding: 0.15rem 1rem 0 1rem;
      border-radius: 7px;
      margin: 0 5px;
      white-space: nowrap;
    }
</style>