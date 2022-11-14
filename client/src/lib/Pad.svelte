<script lang="ts">
  import SpecInput from './SpecInput.svelte'
  import { padStore } from './stores';
  import Panel from './Panel.svelte'

  const onclick = () => {
    if (!window.pyg) {
      console.log('no pyscript yet')
    } else {
     window.pyg.get('run_click')();
    }
  }

  let specStatus = padStore.specStatus;
  
</script>

<div class="gp-container">
  <Panel title="Spec" status={$specStatus} class="glom-spec-container">
    <SpecInput />

    <button id="run-button" on:click={onclick}>Glom it!</button>
  </Panel>
  <div>
    <Panel title="Target">
      <code-input id="glom-target-input" lang="python" value="{`{'a': {'b': {'c': 'd'}}}`}" template="syntax-highlighted" ></code-input>
    </Panel>
  </div>
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

</style>