<script lang="ts">
    import CodeMirror from "svelte-codemirror-editor";
    import { githubLight, githubDark } from "@uiw/codemirror-theme-github";
    import { keymap } from "@codemirror/view";
    import { Prec } from "@codemirror/state";

    import { darkModeStore } from "./stores";
    import copyText from "./actions/copyText";
    import tooltip from "./actions/tooltip";
    import Icon from "./Icon.svelte";

    export let execute;
    export let destStore;
    export let lang;

    export let readonly = false;
    let classes = "";
    export let cmClass = "";
    export { classes as class };

    export let placeholder = "";
    export let extraExtensions = [];
    export let styles = {};
    export let copyTooltip = "Copy to clipboard";

    let padInput;
    let editor;
    let theme;
    $: {
        theme = $darkModeStore ? githubDark : githubLight;
    }

    const getText = () => {
        return padInput.querySelector(".cm-wrap .cm-content").innerText;
    };

    const ctrlEnterKeymap = keymap.of([
        {
            key: "Ctrl-Enter",
            run: (view) => {
                // can get the event, too, by defining "any"
                // TODO: deal with delays either coming from codemirror or svelte storage
                setTimeout(execute, 100);
                return true;
            },
        },
        {
            key: "Shift-Enter",
            run: (view) => {
                // can get the event, too, by defining "any"
                // TODO: deal with delays either coming from codemirror or svelte storage
                setTimeout(execute, 100);
                return true;
            },
        },
    ]);

    let extensions = [Prec.highest(ctrlEnterKeymap), ...extraExtensions];
</script>

<div bind:this={padInput} class="padInput {classes}">
    <CodeMirror
        bind:value={$destStore}
        bind:this={editor}
        class="cm-wrap {cmClass}"
        {lang}
        {extensions}
        {theme}
        {placeholder}
        {readonly}
        editable={!readonly}
        basic={true}
        styles={{
            "&": {
                height: "100%",
                "min-width": "100px",
                "max-width": "100%",
                overflow: "scroll",
                ...styles,
            },
        }}
    />

    <button
        class="copy-button"
        use:tooltip={{
            content: copyTooltip,
            placement: "top",
        }}
        use:copyText={getText}
    >
        <Icon name="copy" />
    </button>
</div>

<style>
    .padInput :global(.cm-wrap) {
        flex: 1 1 100%;
        min-width: 140px;
    }

    .padInput {
        border: 1px solid var(--gray-3);
        border-radius: 3px;
        box-sizing: border-box;
        display: flex;
        flex-direction: row;
        font-family: "monospace";
        outline: 0;
        padding: 0;
        width: 100%;
        max-width: 100vw;
    }

    button {
        display: flex;
        margin: 0;
        border: 0;
        border-left: 1px solid var(--gray-3) !important;
        color: var(--gray-4);
        cursor: pointer;
        justify-content: center;
        align-items: center;
        user-select: none;
        background: var(--gray-1);
    }

    button:hover {
        background: var(--gray-0);
        border-color: var(--primary-color-8);
        color: var(--primary-color-8);
    }
</style>
