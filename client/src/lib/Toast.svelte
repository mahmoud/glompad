<script>
    import { createEventDispatcher } from "svelte";
    import { fade } from "svelte/transition";
    import Icon from "./Icon.svelte";

    const dispatch = createEventDispatcher();

    export let type = "error";
    export let dismissible = true;
</script>

<div class="toast {type}" role="alert" transition:fade>
    {#if type === "success"}
        <Icon name="check-circle" />
    {:else if type === "error"}
        <Icon name="x-circle" />
    {:else}
        <Icon name="info" />
    {/if}

    <div class="text">
        <slot />
    </div>

    {#if dismissible}
        <button class="close" on:click={() => dispatch("dismiss")}>
            <Icon name="x" />
        </button>
    {/if}
</div>

<style>
    div.toast {
        color: var(--gray-7);
        padding: 0.65rem;
        padding-right: 1rem;
        border-radius: 0.2rem;
        display: flex;
        align-items: center;
        margin: 0 auto 0.5rem auto;
        max-width: 50vw;
    }
    .error {
        background: var(--primary-color-2);
    }
    .success {
        background: var(--secondary-color-2);
    }
    .info {
        background: var(--gray-2);
    }
    .text {
        margin-left: 1rem;
    }
    button {
        color: var(--gray-7);
        background: transparent;
        border: 0 none;
        padding: 0;
        margin-left: 12px;
        line-height: 1;
        font-size: 1rem;
        cursor: pointer;
    }
</style>
