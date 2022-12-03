<script lang="ts">
  import SpecInput from './SpecInput.svelte'
  import { padStore, urlStore, largeScreenStore } from './stores';
  import Panel from './Panel.svelte'

	import CodeMirror from "svelte-codemirror-editor";
  import { python } from "@codemirror/lang-python";
  
  import { githubLight, githubDark } from '@uiw/codemirror-theme-github';
  import Drawer from './Drawer.svelte';

  let classes = "";
  export {classes as class};
  let {specStatus, targetValue, targetStatus, resultValue, resultStatus} = padStore;
  
  urlStore.subscribe(value => {
    if (window && window.location.href != value) {
      window.location.href = value;
    }
  });

  let wrap_class: string;
  $: wrap_class = $largeScreenStore ? "cm-wrap-large" : "cm-wrap-small";
</script>

<div class="gp-container {classes}">
  <Panel title="Spec" status={$specStatus} class="glom-spec-container">
    <SpecInput />
  </Panel>
  <Panel title="Target" class="glom-target-container" status={$targetStatus}>
    <CodeMirror
      bind:value={$targetValue}
      class="{wrap_class} cm-target-wrap"
      lang={python()}
      basic={true}
      on:change={onchange}
      theme={githubLight}
      placeholder="Insert your target data here. JSON and Python literals supported."
      styles={{
        "&": {
          "min-width": "100px",
          "max-width": "100%",
          "height": "100%",
          "overflow": "scroll",
        },
      }}
    />
  </Panel>
  <Panel title="Result" class="glom-result-container" status={$resultStatus}>
    <CodeMirror
      bind:value={$resultValue}
      class="{wrap_class} cm-result-wrap"
      basic={true}
      lang={$resultStatus.match(/error/ig) ? null : python()}
      theme={githubLight}
      editable={false}
      readonly={true}
      placeholder="Result will be displayed here after executing your glom spec."
      styles={{
        "&": {
          "min-width": "100px",
          "max-width": "100%",
          "height": "100%",
          "overflow": "scroll",
        },
      }}
    />
  </Panel>
</div>

<style>
:global(body.drawer-open) .glompad {
  margin-left: 250px;
  transition: all .1s ease-in-out;
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

:global(.glom-spec-container) {
  min-height: 100px;
  flex-grow: 1;
}

:global(.cm-target-wrap) { 
  background: #fff;
  border: 1px solid silver;
}

:global(.glom-target-container) { 
  min-height: 200px;
  flex-grow: 1;
}

:global(.cm-result-wrap) { 
  background: #fff;
  border: 1px solid silver;
}


:global(.glom-result-container) { 
  flex-grow: 2;
}


</style>