<script lang="ts">
    import tooltip from "./actions/tooltip";

    export let status;

    const fmt_timing = (timing: number) => {
        let unit = "ms";
        if (timing > 1000) {
            timing *= 1000;
            unit = "s";
        }
        return " (" + timing.toFixed(3) + unit + ")";
    };

    let debug_text = "";
    let detail = "";
    $: {
        status.rounded_timing = fmt_timing(status.timing);
        debug_text = JSON.stringify(status);
        detail = status.detail + status.rounded_timing;
    }
</script>

<!-- {debug_text} -->
<div
    class="panel-status-badge {status.kind}"
    use:tooltip={{
        content: detail,
        disabled: detail == "",
        placement: "bottom",
        delay: [400, 0],
    }}
>
    {#if status.subtitle}
        {status.title}: {status.subtitle}
    {:else}
        {status.title}
    {/if}
</div>

<style>
    .panel-status-badge {
        background: var(--secondary-color-2);
        display: inline-flexbox;
        font-size: 0.85rem;
        padding: 0.15rem 1rem 0 1rem;
        border-radius: 7px;
        margin: 1px 0 0 auto;
        white-space: nowrap;
    }

    .error {
        background: var(--primary-color-4);
        font-weight: bold;
    }

    .warning {
        background: var(--gray-3);
        font-weight: bold;
    }
</style>
