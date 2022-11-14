<script lang="ts">
  import SpecInput from './SpecInput.svelte'
  import { padStore } from './stores';
  import Panel from './Panel.svelte'

	import CodeMirror from "svelte-codemirror-editor";
  import { python } from "@codemirror/lang-python";
  import { githubLight } from '@uiw/codemirror-theme-github';

  const onclick = () => {
    if (!window.pyg) {
      console.log('no pyscript yet')
    } else {
     window.pyg.get('run_click')();
    }
  }

  let specStatus = padStore.specStatus;
  let {targetValue, targetStatus} = padStore;
  
</script>

<div class="gp-container">
  <Panel title="Spec" status={$specStatus} class="glom-spec-container">
    <SpecInput />

    <button id="run-button" on:click={onclick}>Glom it!</button>
  </Panel>
    <Panel title="Target" class="glom-target-container" status={$targetStatus}>
      <!-- <code-input id="glom-target-input" lang="python" value="{`{'a': {'b': {'c': 'd'}}}`}" template="syntax-highlighted" ></code-input> -->
      <CodeMirror
        bind:value={$targetValue}
        class="cm-target-wrap"
        lang={python()}
        basic={false}
        on:change={onchange}
        theme={githubLight}
        styles={{
          "&": {
            "min-width": "100px",
            "height": "100%",
          },
        }}
      />
    </Panel>
  <div>
    <Panel title="Result">
      <code-input id="glom-result-input" lang="python" value="d" template="syntax-highlighted" ></code-input>
    </Panel>
  </div>
</div>

<style>
.gp-container {
  display: grid;
  grid-gap: 10px;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  grid-auto-flow: row;

  grid-template-areas: "spec spec"
                       "target result";
}

:global(.glom-spec-container) {
  grid-area: spec;
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
}

</style>