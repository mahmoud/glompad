<script>
    import tooltip from "./actions/tooltip";
    import { padStore } from "./stores";

    export let domNode;
    let { enableAutoformat } = padStore;
</script>

<style>
.menu-title {
    border-bottom: 1px solid silver;
    margin-bottom: 6px;
}

</style>

<div id="optionsMenu" bind:this={domNode}>
    <p class="menu-title">Options</p>
    <div use:tooltip={{
            content: "Automatically format spec and target on execution using the black autoformatter. Also use black for result formatting instead of pprint.",
            placement: "right",
            delay: [400, 0],
        }}>
        <input id="autoformat-checkbox" type="checkbox" bind:checked={$enableAutoformat} />
        <label for="autoformat-checkbox">Autoformat (black)</label>
    </div>
</div>