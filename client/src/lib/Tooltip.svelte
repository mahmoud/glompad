<script>
    import { createPopperActions } from "svelte-popperjs";

    const [popperRef, popperContent] = createPopperActions({
        placement: "right",
        strategy: "fixed",
    });
    const extraOpts = {
        modifiers: [{ name: "offset", options: { offset: [0, 8] } }],
    };

    export let showTooltip = false;
</script>

<style>
    #tooltip {
    background: #333;
    color: white;
    font-weight: bold;
    padding: 4px 8px;
    font-size: 13px;
    border-radius: 4px;
    }
    
    #arrow,
    #arrow::before {
        position: absolute;
        width: 8px;
        height: 8px;
        background: inherit;
    }

    #arrow {
        visibility: hidden;
    }

    #arrow::before {
        visibility: visible;
        content: "";
        transform: rotate(45deg);
    }

    :global(#tooltip[data-popper-placement^="top"]) > #arrow {
        bottom: -4px;
    }

    :global(#tooltip[data-popper-placement^="bottom"]) > #arrow {
        top: -4px;
    }

    :global(#tooltip[data-popper-placement^="left"]) > #arrow {
        right: -4px;
    }

    :global(#tooltip[data-popper-placement^="right"]) > #arrow {
        left: -4px;
    }
</style>

{#if showTooltip}
    <div id="tooltip" use:popperContent={extraOpts}>
        <slot popref={popperRef}></slot>
        Optionsz
        <div id="arrow" data-popper-arrow />
    </div>
{/if}