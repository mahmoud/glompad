<script>
    import tooltip from "./actions/tooltip";
    import { padStore, darkModeStore } from "./stores";

    export let domNode = null;
    export let withTitle = true;
    let { enableAutoformat, enableScope } = padStore;
</script>

<style>
.menu-title {
    border-bottom: 1px solid silver;
    margin-bottom: 6px;
}

.option, .option > * {
    cursor: pointer;
}

</style>

<div id="optionsMenu" bind:this={domNode}>
    {#if withTitle}
    <p class="menu-title">Options</p>
    {/if}
    <div class="option" id="autoformat-item" use:tooltip={{
        content: "Automatically format spec and target on execution using the black autoformatter. Also use black for result formatting instead of pprint.",
        placement: "right",
        delay: [400, 0],
    }}>
        <input id="autoformat-checkbox" type="checkbox" bind:checked={$enableAutoformat} />
        <label for="autoformat-checkbox">Autoformat (black)</label>
    </div>
    <div class="option" id="scope-item" use:tooltip={{
        content: "Show input for glom scope, for advanced glom usage.",
        placement: "right",
        delay: [400, 0],
    }}>
        <input id="scope-checkbox" type="checkbox" bind:checked={$enableScope} />
        <label for="scope-checkbox">Enable glom scope {$enableScope}</label>
    </div>
    <div class="option" id="darkmode-item" use:tooltip={{
        content: "Override browser/OS preference and force dark mode.",
        placement: "right",
        delay: [400, 0],
    }}>
        <input id="darkmode-checkbox" type="checkbox" bind:checked={$darkModeStore}  />
        <label for="darkmode-checkbox">Dark mode</label>
    </div>
</div>