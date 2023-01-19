<script lang="ts">
  import {
    padStore,
    largeScreenStore,
    isValidURL,
    FetchStatus,
    InputStatus,
  } from "./stores";
  import Toasts from "./Toasts.svelte";
  import Panel from "./Panel.svelte";
  import PadInput from "./PadInput.svelte";
  import { addToast } from "./toastStore";

  import { tick } from "svelte";

  import { python } from "@codemirror/lang-python";

  let classes = "";
  export { classes as class };
  let {
    specValue,
    specStatus,
    targetValue,
    targetStatus,
    targetURLValue,
    targetDestStore,
    targetFetchStatus,
    resultValue,
    resultStatus,
    enableScope,
    scopeValue,
    scopeStatus,
    enableDebug,
    settlingHref,
    specChanged,
    targetChanged,
    curRunID,
  } = padStore;

  function copySuccess(e) {
    const targetname = e.target.attributes["data-name"].value;
    if (!targetname) {
      return;
    }
    const message = "Successfully copied " + targetname + " to clipboard.";
    addToast({ message, type: "success" });
  }
  window.addEventListener("copysuccess", copySuccess);

  let storeDebug;
  padStore.deriveAll().subscribe(() => {
    storeDebug = padStore.toJson();
  });

  let targetDestStatus = targetStatus;
  let wrap_class: string;
  let showTargetPreview: boolean = false;

  targetValue.subscribe(async (val) => {
    const isURL = isValidURL($targetValue);
    if ($settlingHref) {
      //reset
      if (!isURL) {
        // hack which, if missing, shows targetData field as
        // blank instead of targetURLValue
        $targetDestStore = targetValue;
        $targetURLValue = "";
      }
      $targetFetchStatus = new FetchStatus("");
      targetDestStatus = targetStatus;
      showTargetPreview = false;

      // without this hack, codemirror doesn't rerender when the store changes out from underneath it.
      // Adding another store which points to the right store did not fix this.
      await tick();
      if ($targetValue) {
        $targetValue = $targetValue + " ";
      }
    }
    if (isValidURL($targetValue)) {
      //switch forward  // TODO: infinite loop technically possible if API returns url, could check that the first char is json?
      $targetURLValue = $targetValue.trim();
      await tick();
      $targetDestStore = targetURLValue;
      console.log("yes", $targetURLValue);
      targetDestStatus = targetFetchStatus;
      showTargetPreview = true;
    }
  });

  targetURLValue.subscribe((val) => {
    if ($targetDestStore == targetURLValue && !isValidURL($targetURLValue)) {
      //switch back
      $targetDestStore = targetValue;
      if (!$settlingHref) {
        $targetValue = $targetURLValue;
      }
      $targetURLValue = "";
      $targetFetchStatus = new FetchStatus("");
      targetDestStatus = targetStatus;
      showTargetPreview = false;
    }
  });

  async function updateFetch(target_url) {
    if (
      target_url &&
      $targetFetchStatus &&
      $targetFetchStatus.url != target_url
    ) {
      const prevStatusRunID = $targetFetchStatus.run_id;

      $targetFetchStatus = new FetchStatus(target_url, "pending", $curRunID);
      $targetValue = "";
      $targetStatus = new InputStatus("pending", $curRunID);

      try {
        const resp = await fetch(target_url);
        const text = await resp.text();
        try {
          $targetFetchStatus = new FetchStatus(
            target_url,
            "success",
            $curRunID
          );

          $targetValue = text;
          if (window && window.pyg) {
            const [loaded_target, loaded_status] = window.pyg.get(
              "load_target"
            )(text, $curRunID);
            $targetStatus = loaded_status;
          }

          if (prevStatusRunID < $resultStatus.run_id) {
            padStore.executeGlom();
          }
        } catch (load_err) {
          console.warn(load_err); // TODO?
        }
      } catch (err) {
        $targetFetchStatus = new FetchStatus(
          target_url,
          "error",
          $curRunID,
          null,
          err.toString()
        );
        $targetValue = "";
      }
    }
  }

  targetURLValue.subscribe(updateFetch);

  let target_placeholder;
  $: {
    wrap_class = $largeScreenStore ? "cm-wrap-large" : "cm-wrap-small";
    if ($targetFetchStatus.kind == "pending") {
      target_placeholder = "Loading data from target API...";
    } else {
      target_placeholder =
        "Data from the target API will be shown here once run.";
    }
  }
</script>

<div class="gp-container {classes}">
  <Toasts />
  <Panel
    title="Glom Spec"
    status={$specStatus}
    class="glom-spec-container"
    isChanged={$specChanged}
    flex_grow="1"
  >
    <PadInput
      name="glom spec"
      execute={padStore.executeGlom}
      destStore={specValue}
      lang={python()}
      cmClass="{wrap_class} cm-spec-wrap"
      placeholder="Insert your glom spec here, or try one of the examples in the menu."
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
        name="glom scope"
        execute={padStore.executeGlom}
        destStore={scopeValue}
        lang={python()}
        cmClass="{wrap_class} cm-scope-wrap"
        placeholder="Insert your scope data here. JSON and Python literals supported."
      />
    </Panel>
  {/if}

  <Panel
    title="Target Data"
    class="glom-target-container"
    status={$targetDestStatus}
    isChanged={showTargetPreview ? undefined : $targetChanged}
    flex_grow={showTargetPreview ? 0 : 1}
  >
    <PadInput
      name={showTargetPreview ? "target URL" : "target data"}
      execute={padStore.executeGlom}
      destStore={$targetDestStore}
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
        name="target data"
        execute={padStore.executeGlom}
        destStore={targetValue}
        lang={python()}
        readonly={true}
        cmClass="{wrap_class} cm-target-preview-wrap"
        placeholder={target_placeholder}
        styles={{
          "&": {},
        }}
      />
    </Panel>
  {/if}

  <Panel
    title="Result"
    class="glom-result-container"
    status={$resultStatus}
    flex_grow="2"
  >
    <PadInput
      name="glom result"
      execute={padStore.executeGlom}
      destStore={resultValue}
      lang={$resultStatus.kind == "error" ? null : python()}
      readonly={true}
      cmClass="{wrap_class} cm-result-wrap"
      placeholder="Result will be displayed here after executing your glom spec."
    />
  </Panel>

  {#if $enableDebug}
    <Panel
      title="Debug: Stores"
      status={$resultStatus}
      flex_grow="3"
      collapsed={true}
      scroll={true}
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
    height: calc(100vh - 150px);
  }

  :global(.cm-spec-wrap),
  :global(.cm-target-wrap),
  :global(.cm-result-wrap),
  :global(.cm-scope-wrap) {
    background: var(--gray-0);
    border: 1px solid var(--gray-2);
  }
</style>
