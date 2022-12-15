<script lang="ts">
  import SpecInput from "./SpecInput.svelte";
  import {
    padStore,
    darkModeStore,
    urlStore,
    largeScreenStore,
  } from "./stores";
  import Panel from "./Panel.svelte";
  import CodeInput from "./CodeInput.svelte";

  import CodeMirror from "svelte-codemirror-editor";
  import { python } from "@codemirror/lang-python";

  import { githubLight, githubDark } from "@uiw/codemirror-theme-github";

  let classes = "";
  export { classes as class };
  let {
    executeGlom,
    specValue,
    specStatus,
    targetValue,
    targetStatus,
    resultValue,
    resultStatus,
    enableScope,
    scopeValue,
    scopeStatus,
    stateStack,
  } = padStore;

  urlStore.subscribe((value) => {
    if (window && window.location.href != value) {
      window.location.href = value;
    }
  });

  function copySuccess(e) {
    // TODO: toast or something
    window.console.warn("copy success!");
  }

  window.addEventListener("copysuccess", copySuccess);

  // doesn't infinite loop bc stateStack shortcircuits when the state is unchanged
  stateStack.subscribe(executeGlom);

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
    <CodeInput
      execute={executeGlom}
      destStore={specValue}
      lang={python()}
      cmClass="{wrap_class} cm-spec-wrap"
      placeholder="Insert your glom spec here"
    />
  </Panel>
  {#if $enableScope}
    <Panel
      title="Glom Scope"
      class="glom-scope-container"
      status={$scopeStatus}
      flex_grow="1"
    >
      <CodeInput
        execute={executeGlom}
        destStore={scopeValue}
        lang={python()}
        cmClass="{wrap_class} cm-scope-wrap"
        placeholder="Insert your scope data here. JSON and Python literals supported."
        styles={{
          "&": {
            "min-width": "100px",
            "max-width": "100%",
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
    <CodeInput
      execute={executeGlom}
      destStore={targetValue}
      lang={python()}
      cmClass="{wrap_class} cm-target-wrap"
      placeholder="Insert your target data here. JSON and Python literals supported."
      styles={{
        "&": {
          "min-width": "100px",
          "max-width": "100%",
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
    <CodeInput
      execute={executeGlom}
      destStore={resultValue}
      lang={$resultStatus.kind == "error" ? null : python()}
      readonly={true}
      cmClass="{wrap_class} cm-result-wrap"
      placeholder="Result will be displayed here after executing your glom spec."
      styles={{
        "&": {
          "min-width": "100px",
          "max-width": "100%",
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

  :global(.cm-spec-wrap),
  :global(.cm-target-wrap),
  :global(.cm-result-wrap),
  :global(.cm-scope-wrap) {
    background: var(--gray-0);
    border: 1px solid var(--gray-2);
  }
</style>
