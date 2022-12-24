<script lang="ts">
    import Icon from "./Icon.svelte";
    import tooltip from "./actions/tooltip";

    export let status;
    export let isChanged: Function = null;

    const fmt_timing = (timing: number) => {
        let unit = "ms";
        if (timing > 1000) {
            timing *= 1000;
            unit = "s";
        }
        return timing.toFixed(3) + unit;
    };

    const fmt_created_at = (created_at: string) => {
        try {
            const date = new Date(created_at);
            return date.toLocaleTimeString();
        } catch {
            console.warn(created_at);
            console.trace();
        }
    };

    let tooltip_content_div: HTMLDivElement;
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
        content: tooltip_content_div,
        disabled: detail == "",
        placement: "bottom",
        delay: [400, 0],
        interactive: true,
    }}
>
    {#if isChanged}
        <Icon name="edit-3" stroke="currentColor" />
    {:else if status.kind == "success"}
        <Icon name="check" stroke="currentColor" />
    {:else if status.kind == "error"}
        <Icon name="alert-circle" stroke="currentColor" />
    {:else if status.kind == "pending"}
        <Icon name="loader" stroke="currentColor" />
    {/if}
</div>

<div bind:this={tooltip_content_div} style:display="block">
    {#if isChanged}
        <p>
            Modified since last run.
            {#if status.detail}
                Last message:
            {/if}
        </p>
    {/if}
    {#if status.subtitle}
        {status.subtitle}
    {/if}
    {#if status.detail}
        <pre style="font-size:90%">{status.detail}</pre>
    {/if}
    <p>
        {#if status.run_id}[{status.run_id}]{/if}
        Took {fmt_timing(status.timing)} at {fmt_created_at(status.created_at)}.
    </p>
</div>

<style>
    .panel-status-badge {
        color: var(--gray-7);
        background: var(--secondary-color-2);
        display: inline-flexbox;
        font-size: 0.85rem;
        padding: 0.15rem 1rem 0 1rem;
        border-radius: 7px;
        margin: 1px 0 0 auto;
        white-space: nowrap;
    }

    .error {
        color: var(--gray-8);
        background: var(--primary-color-3);
    }
</style>
