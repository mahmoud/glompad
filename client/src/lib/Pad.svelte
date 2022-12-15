<script lang="ts">
  import SpecInput from "./SpecInput.svelte";
  import {
    padStore,
    darkModeStore,
    urlStore,
    largeScreenStore,
  } from "./stores";
  import Panel from "./Panel.svelte";

  import CodeMirror from "svelte-codemirror-editor";
  import { python } from "@codemirror/lang-python";

  import { githubLight, githubDark } from "@uiw/codemirror-theme-github";

  let classes = "";
  export { classes as class };
  let {
    specStatus,
    targetValue,
    targetStatus,
    resultValue,
    resultStatus,
    enableScope,
    scopeValue,
    scopeStatus,
  } = padStore;

  urlStore.subscribe((value) => {
    if (window && window.location.href != value) {
      window.location.href = value;
    }
  });

  let wrap_class: string;
  let theme;
  $: {
    wrap_class = $largeScreenStore ? "cm-wrap-large" : "cm-wrap-small";
    theme = $darkModeStore ? githubDark : githubLight;
  }
</script>

<div class="gp-container {classes}">
  <Panel
    title="Glom Spec"
    status={$specStatus}
    class="glom-spec-container"
    min_height="100px"
    flex_grow="1"
  >
    <SpecInput />
  </Panel>
  {#if $enableScope}
    <Panel
      title="Glom Scope"
      class="glom-scope-container"
      status={$scopeStatus}
      flex_grow="1"
    >
      <CodeMirror
        bind:value={$scopeValue}
        class="{wrap_class} cm-scope-wrap"
        lang={python()}
        basic={true}
        theme={$darkModeStore ? githubDark : githubLight}
        placeholder="Insert your scope data here. JSON and Python literals supported."
        styles={{
          "&": {
            "min-width": "100px",
            "max-width": "100%",
            height: "100%",
            overflow: "scroll",
          },
        }}
      />
    </Panel>
  {/if}
  <Panel
    title="Target Data"
    class="glom-target-container"
    status={$targetStatus}
    flex_grow="1"
  >
    <CodeMirror
      bind:value={$targetValue}
      class="{wrap_class} cm-target-wrap"
      lang={python()}
      basic={true}
      theme={$darkModeStore ? githubDark : githubLight}
      placeholder="Insert your target data here. JSON and Python literals supported."
      styles={{
        "&": {
          "min-width": "100px",
          "max-width": "100%",
          height: "100%",
          overflow: "scroll",
        },
      }}
    />
  </Panel>
  <!-- {JSON.stringify( $resultStatus)} -->
  <Panel
    title="Result"
    class="glom-result-container"
    status={$resultStatus}
    flex_grow="2"
  >
    <CodeMirror
      bind:value={$resultValue}
      class="{wrap_class} cm-result-wrap"
      basic={true}
      lang={$resultStatus.title && $resultStatus.title.match(/error/gi)
        ? null
        : python()}
      {theme}
      editable={false}
      readonly={true}
      placeholder="Result will be displayed here after executing your glom spec."
      styles={{
        "&": {
          "min-width": "100px",
          "max-width": "100%",
          height: "100%",
          overflow: "scroll",
        },
      }}
    />
  </Panel>
</div>

<style>
  :global(body.drawer-open) .glompad {
    margin-left: 250px;
    transition: all 0.1s ease-in-out;
  }

  :global(.cm-wrap-small) {
    font-size: 2.4vw !important;
  }

  .gp-container {
    display: flex;
    flex-direction: column;
    flex: 1;
    padding: 10px;
    align-items: center;
  }

  :global(.cm-target-wrap),
  :global(.cm-result-wrap),
  :global(.cm-scope-wrap) {
    background: var(--gray-1);
    border: 1px solid silver;
  }
</style>
