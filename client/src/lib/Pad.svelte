<script lang="ts">
  import SpecInput from './SpecInput.svelte'
  import { padStore, urlStore } from './stores';
  import Panel from './Panel.svelte'

	import CodeMirror from "svelte-codemirror-editor";
  import { python } from "@codemirror/lang-python";
  
  import { githubLight } from '@uiw/codemirror-theme-github';

  let classes = "";
  export {classes as class};
  let {specStatus, targetValue, targetStatus, resultValue, resultStatus} = padStore;
  

  urlStore.subscribe(value => {
    console.log('got ' + value);
    if (window && window.location.href != value) {
      window.location.href = value;
    }
  });
</script>

<div class="gp-container {classes}">
  <Panel title="Spec" status={$specStatus} class="glom-spec-container">
    <SpecInput />
  </Panel>
  <Panel title="Target" class="glom-target-container" status={$targetStatus}>
    <CodeMirror
      bind:value={$targetValue}
      class="cm-target-wrap"
      lang={python()}
      basic={true}
      on:change={onchange}
      theme={githubLight}
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
      class="cm-result-wrap"
      basic={true}
      lang={$resultStatus.match(/error/ig) ? null : python()}
      theme={githubLight}
      editable={false}
      readonly={true}
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
.gp-container {
  display: flex;
  flex-direction: column;
  flex: 1;
  height: 100%;
  padding: 10px;
  position: relative;
}

:global(.glom-spec-container) {
  min-height: 100px;
}

.gp-container > div {
  background-color: lightgray;
}

:global(.cm-target-wrap) { 
  height: 100%;
  background: #fff;
  border: 1px solid silver;
}

:global(.glom-target-container) { 
  display: flex;
  flex-flow: column;
  height: 100%;
  min-height: 200px;
}

:global(.cm-result-wrap) { 
  height: 100%;
  background: #fff;
  border: 1px solid silver;
}

:global(.glom-result-container) { 
  display: flex;
  flex-direction: column;
  flex: 1 1 auto !important;
}

</style>