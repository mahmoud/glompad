<script>
	import CodeMirror from "svelte-codemirror-editor";
	import { basicSetup } from 'codemirror';
	import { githubLight } from '@uiw/codemirror-theme-github';
	import { python } from "@codemirror/lang-python";
	import { keymap } from "@codemirror/view";
	import { Prec } from "@codemirror/state";

	import copyText from "./actions/copyText";
	import tooltip from "./actions/tooltip";
	import unstyledTooltip from "./actions/unstyledTooltip";

	import { padStore } from "./stores";
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

	const { specValue, targetValue, stateStack } = padStore;

	const executeGlom = () => {
		if (!window.pyg) {
			console.log("no pyscript yet");
			return;
		}

		window.pyg.get("run_click")();
		const specFormatted = window.pyg.get("autoformat")($specValue);
		$specValue = specFormatted;
		const targetFormatted = window.pyg.get("autoformat")($targetValue);
		$targetValue = targetFormatted;

		padStore.saveState() // TODO: option to only save successful specs?
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
	let optionsMenu;
	let specEditor;
	let extensions = [basicSetup, Prec.highest(ctrlEnterKeymap)];
</script>

<!------html-->

<div class="padInput">
	<div
		class="opts-button"
		role="button"
		tabindex="0"
		on:click={optsClick}
		on:keydown={optsClick}
		use:unstyledTooltip={{
			content: optionsMenu,
			placement: "bottom",
			trigger: "click",
			interactive: true,
		}}
		use:tooltip={{
			content: "Options",
			placement: "top",
			delay: [400, 0],
		}}
		>
		<Icon name="more-vertical" height=1.5em width=1.2em/>
	</div>

	<CodeMirror
		bind:value={$specValue}
		bind:this={specEditor}
		class="cm-wrap"
		lang={python()}
		extensions={extensions}
		basic={false}
		theme={githubLight}
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

	<div id="optionsMenu" bind:this={optionsMenu}>
		<ul>
			<li use:tooltip={{
				content: "Test",
				placement: "right"
			}}>Test</li>
			<li><a href="https://mahmoud.photos">Photos</a></li>
		</ul>
	</div>
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

	.opts-button {
		padding-top: 8px;
		cursor: pointer;
		color: #aaa;
		border-right: 1px solid silver;
	}

	button {
		display: flex;
		margin: 0;
		border: 0;
		border-left: 1px solid silver !important;
		color: #aaa;
		cursor: pointer;
		justify-content: center;
		align-items: center;
		user-select: none;
		background: #fff;
	}

	.opts-button:hover {
		background: #ededed;
	}

	button:hover {
		background: #ededed;
	}

	.run-button {
		flex: 1 0 auto;
		padding: 0 12px;
	}
</style>
