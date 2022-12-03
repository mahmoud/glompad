<script>
    import tooltip from "./actions/tooltip";
    import { padStore } from "./stores";
    import DarkModeOption from './DarkModeOption.svelte';

    export let domNode = null;
    export let withTitle = true;
    let { enableAutoformat } = padStore;
</script>

<style>
.menu-title {
    border-bottom: 1px solid silver;
    margin-bottom: 6px;
}

#autoformat-item, #autoformat-item > * {
    cursor: pointer;
}

</style>

<div id="optionsMenu" bind:this={domNode}>
    {#if withTitle}
    <p class="menu-title">Options</p>
    {/if}
    <div id="autoformat-item" use:tooltip={{
            content: "Automatically format spec and target on execution using the black autoformatter. Also use black for result formatting instead of pprint.",
            placement: "right",
            delay: [400, 0],
        }}>
        <input id="autoformat-checkbox" type="checkbox" bind:checked={$enableAutoformat} />
        <label for="autoformat-checkbox">Autoformat (black)</label>
    </div>
    <div id="darkmode-item">
        <DarkModeOption />
    </div>
</div>