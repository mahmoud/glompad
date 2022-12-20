<script lang="ts">
  import { padStore, urlStore, largeScreenStore, isValidURL } from "./stores";
  import Panel from "./Panel.svelte";
  import PadInput from "./PadInput.svelte";

  import { python } from "@codemirror/lang-python";

  let classes = "";
  export { classes as class };
  let {
    executeGlom,
    specValue,
    specStatus,
    targetValue,
    targetStatus,
    targetURLValue,
    targetFetchStatus,
    resultValue,
    resultStatus,
    enableScope,
    scopeValue,
    scopeStatus,
    stateStack,
    enableDebug,
    settlingHref,
  } = padStore;

  // TODO: use this to create targetIsURL derived store

  function copySuccess(e) {
    // TODO: toast or something
    window.console.warn("copy success!");
  }

  window.addEventListener("copysuccess", copySuccess);

  // doesn't infinite loop bc stateStack shortcircuits when the state is unchanged
  stateStack.subscribe(executeGlom);

  let storeDebug;
  padStore.deriveAll().subscribe(() => {
    storeDebug = padStore.toJson();
  });

  let targetDestStore = targetValue;
  let targetDestStatus = targetStatus;
  let wrap_class: string;
  let showTargetPreview: boolean = false;

  targetValue.subscribe((val) => {
    console.warn(val);
    if ($settlingHref) {
      //reset
      $targetURLValue = "";
      //targetDestStore = targetValue;
      targetDestStatus = targetStatus;
      showTargetPreview = false;
    }
    if (isValidURL($targetValue)) {
      //switch forward  // TODO: infinite loop technically possible if API returns url, could check that the first char is json?
      $targetURLValue = $targetValue;
      targetDestStore = targetURLValue;
      targetDestStatus = targetFetchStatus;
      showTargetPreview = true;
    }
  });

  $: {
    wrap_class = $largeScreenStore ? "cm-wrap-large" : "cm-wrap-small";

    if (!isValidURL($targetURLValue)) {
      //switch back
      $targetValue = $targetURLValue;
      $targetURLValue = "";
      targetDestStore = targetValue;
      targetDestStatus = targetStatus;
      showTargetPreview = false;
    }
    if ($targetURLValue) {
      fetch($targetURLValue)
        .then((resp) => resp.text())
        .then((data) => {
          $targetValue = data;
          if (window && window.pyg) {
            const [loaded_target, loaded_status] =
              window.pyg.get("load_target")(data);
            $targetStatus = loaded_status;
          }
        }); // TODO: Fetch status
    }
  }

  // TODO: status badge loading state for preview.
</script>

<div class="gp-container {classes}">
  <Panel
    title="Glom Spec"
    status={$specStatus}
    class="glom-spec-container"
    min_height="80px"
    flex_grow="1"
  >
    <PadInput
      execute={executeGlom}
      destStore={specValue}
      lang={python()}
      cmClass="{wrap_class} cm-spec-wrap"
      placeholder="Insert your glom spec here, or try one of the examples on the left."
    />
  </Panel>
  {#if $enableScope}
    <Panel
      title="Glom Scope"
      class="glom-scope-container"
      status={$scopeStatus}
      flex_grow="1"
    >
      <PadInput
        execute={executeGlom}
        destStore={scopeValue}
        lang={python()}
        cmClass="{wrap_class} cm-scope-wrap"
        placeholder="Insert your scope data here. JSON and Python literals supported."
      />
    </Panel>
  {/if}
  <!--<div style:max-height="200px" style:overflow="scroll">
    {$targetDestStore}<br />tuv: {$targetURLValue}<br />tv: {$targetValue}
  </div> -->
  <Panel
    title="Target Data"
    class="glom-target-container"
    status={$targetDestStatus}
    flex_grow={showTargetPreview ? 0 : 1}
  >
    <PadInput
      execute={executeGlom}
      destStore={targetDestStore}
      lang={python()}
      cmClass="{wrap_class} cm-target-wrap"
      placeholder="Insert your target data here. JSON and Python literals supported."
    />
  </Panel>
  {#if showTargetPreview}
    <Panel
      title="Target Data Preview"
      class="glom-target-preview-container"
      status={$targetStatus}
      flex_grow="1"
    >
      <PadInput
        execute={executeGlom}
        destStore={targetValue}
        lang={python()}
        readonly={true}
        cmClass="{wrap_class} cm-target-preview-wrap"
        placeholder={"Data from the target API will be shown here once run."}
        styles={{
          "&": {
            "max-height": "25vh",
          },
        }}
      />
    </Panel>
  {/if}
  <!-- {JSON.stringify( $resultStatus)} -->
  <Panel
    title="Result"
    class="glom-result-container"
    status={$resultStatus}
    flex_grow="2"
  >
    <PadInput
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

  {#if $enableDebug}
    <Panel
      title="Debug: Stores"
      status={$resultStatus}
      flex_grow="3"
      collapsed={true}
    >
      <pre style:font-size="10px">
        {storeDebug}
      </pre>
    </Panel>
  {/if}
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
