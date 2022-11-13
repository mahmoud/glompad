<script lang="ts">
  import CodeMirror from "svelte-codemirror-editor";
  import { padStore } from './stores.js';
  import { python } from "@codemirror/lang-python";
  import { keymap } from '@codemirror/view';
  import CodeInput from './CodeInput.svelte'

  const {specValue, targetValue} = padStore;

  const onclick = (e) => {
    if (!window.pyg) {
      console.log('no pyscript yet')
    } else {
     window.pyg.get('run_click')(e);
    }
  }

  const ctrlEnterKeymap = keymap.of([{
    key: "Ctrl-Enter",
    run: (view, event) => {onclick(event); return true;},
  }])
  
</script>

<div class="gp-container">
  <div id="glom-spec-container">
    <h3>Spec</h3>
    <!-- <code-input id="glom-spec-input" lang="python" value="a.b.c" template="syntax-highlighted"></code-input> -->

    <CodeMirror bind:value={$specValue} lang={python()} extensions={[ctrlEnterKeymap]} basic={false} />

    <CodeInput />

    <button id="run-button" on:click={onclick}>Glom it!</button>
  </div>
  <div>
    <h3>Target</h3>
    <code-input id="glom-target-input" lang="python" value="{`{'a': {'b': {'c': 'd'}}}`}" template="syntax-highlighted" onchange="console.log('Your code is', this.value)"></code-input>
  </div>
  <div>
    <h3>Result</h3>
    <code-input id="glom-result-input" lang="python" value="d" template="syntax-highlighted" onchange="console.log('Your code is', this.value)"></code-input>
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

#glom-spec-container {
  grid-area: spec;
}

.gp-container > div {
  background-color: lightgray;
}

</style>