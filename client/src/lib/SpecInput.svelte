<script>
	import CodeMirror from "svelte-codemirror-editor";
	import { basicSetup } from 'codemirror';
	import { githubLight, githubDark } from '@uiw/codemirror-theme-github';
	import { python } from "@codemirror/lang-python";
	import { keymap } from "@codemirror/view";
	import { Prec } from "@codemirror/state";

	import copyText from "./actions/copyText";
	import tooltip from "./actions/tooltip";

	import { padStore, darkModeStore } from "./stores";
	import Icon from './Icon.svelte';
	
	let curVal = "first";
	let count = 0;

	function optsClick(event) {
		count += 1;
		curVal = "opts clicked " + count;
		showMenu = !showMenu;
	}

	function copySuccess() {
		curVal = "copy success!"
	}

	const { specValue, targetValue, enableAutoformat, stateStack } = padStore;

	const executeGlom = () => {
		if (!window.pyg) {
			console.log("no pyscript yet");
			return;
		}

		padStore.saveState() // TODO: option to only save successful specs?
		window.pyg.get("run_click")();

		if (enableAutoformat) {
			const autoformat = window.pyg.get("autoformat");
			const specFormatted = autoformat($specValue);
			$specValue = specFormatted;
			const targetFormatted = autoformat($targetValue);
			$targetValue = targetFormatted;
		}
	};

	// doesn't infinite loop bc stateStack shortcircuits when the state is unchanged
	stateStack.subscribe(executeGlom);  

	const ctrlEnterKeymap = keymap.of([
		{
			key: "Ctrl-Enter",
			run: (view) => {  // can get the event, too, by defining "any" 
				// TODO: deal with delays either coming from codemirror or svelte storage
				setTimeout(executeGlom, 100);
				return true;
			},
		},
		{
			key: "Shift-Enter",
			run: (view) => {  // can get the event, too, by defining "any" 
				// TODO: deal with delays either coming from codemirror or svelte storage
				setTimeout(executeGlom, 100);
				return true;
			},
		},
	]);

	let showMenu = false;
	let specEditor;
	let extensions = [Prec.highest(ctrlEnterKeymap)];
</script>

<!------html-->

<div class="padInput">
	<CodeMirror
		bind:value={$specValue}
		bind:this={specEditor}
		class="cm-wrap"
		lang={python()}
		extensions={extensions}
		theme={$darkModeStore ? githubDark : githubLight}
		basic={true}
		placeholder="Insert your glom spec here."
		styles={{
			"&": {
				"min-width": "70px",
				"height": "100%",
			},
		}}
	/>
	<button class="run-button" 
		on:click={executeGlom}
		use:tooltip={{
			content: "Run (or Ctrl-Enter via keyboard)",
			placement: "top",
		}}
	><Icon name="play" /></button>

	<button class="copy-button" 
		use:tooltip={{
			content: "Copy spec to clipboard",
			placement: "top",
		}}
	  	use:copyText={".cm-wrap .cm-content"}>
	  <Icon name="copy" />
	</button>
	<button class="link-button" 
		use:tooltip={{
			content: "Copy link to clipboard",
			placement: "top",
		}}
		use:copyText={() => window.location.href}>
	  <Icon name="link" />
	</button>
</div>

<svelte:window on:copysuccess={copySuccess} />

<style>
	.padInput :global(.cm-wrap) {
		flex: 1 1 100%;
		min-width: 140px;
	}

	.padInput {	
		border: 1px solid #aaa;
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
		border-left: 1px solid silver !important;
		color: var(--gray-4);
		cursor: pointer;
		justify-content: center;
		align-items: center;
		user-select: none;
		background: var(--gray-1);
	}

	button:hover {
		background: var(--gray-2);
	}

	.run-button {
		flex: 1 0 auto;
		padding: 0 12px;
	}
</style>
