<script>
	// TODO: factor out tooltip, popover, add clickOutside closing of modal

	import CodeMirror from "svelte-codemirror-editor";
	import { githubLight } from '@uiw/codemirror-theme-github';
	import { python } from "@codemirror/lang-python";
	import { keymap } from "@codemirror/view";

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

	function onchange(e) {
		window.location.hash = "spec=" + $specValue;
	}

	function copySuccess() {
		curVal = "copy success!"
	}

	const { specValue, targetValue } = padStore;

	const onclick = () => {
		if (!window.pyg) {
			console.log("no pyscript yet");
		} else {
			window.pyg.get("run_click")();
		}
	};

	const ctrlEnterKeymap = keymap.of([
		{
			key: "Ctrl-Enter",
			run: (view) => {  // can get the event, too, by defining "any" 
				onclick();
				return true;
			},
		},
	]);

	let showMenu = false;
	let optionsMenu;
</script>

<!------html-->

<div class="padInput">
	<div
		class="optsButton"
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
			placement: "right",
			delay: [400, 0],
		}}
		>
		<Icon name="more-vertical" height=1.5em width=1.2em/>
	</div>

	<CodeMirror
		bind:value={$specValue}
		class="cm-wrap"
		lang={python()}
		extensions={[ctrlEnterKeymap]}
		basic={false}
		theme={githubLight}
		on:change={onchange}
		styles={{
			"&": {
				"min-width": "100px",
				"background": "#eee",
			},
		}}
	/>
	<button class="copyButton" use:copyText={".cm-wrap .cm-content"}><Icon name="copy" /></button>
	<button class="linkButton" use:copyText={".cm-wrap .cm-content"}><Icon name="link" /></button>

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
		background: #eee;
		flex: 1 1 100%;
		min-width: 140px;
		padding: 5px 0;
	}

	.padInput :global(.childClass) {
		color: red;
	}

	.padInput {
		background: #eee;
		border: 1px solid #aaa;
		border-radius: 3px;
		box-sizing: border-box;
		display: flex;
		flex-direction: row;
		font-family: "monospace";
		font-size: 0.95rem;
		outline: 0;
		padding: 0;
		transition: all 0.1s ease;
		transition-property: border-color, box-shadow, background;
		width: 100%;
		max-width: 100vw;
	}

	.optsButton {
		padding-top: 8px;
		cursor: pointer;
		color: #aaa;
	}

	.copyButton {
		margin: 0;
		padding: 12;
		align-items: center;
		cursor: pointer;
		display: flex;
		justify-content: center;
		border-bottom-right-radius: 3px;
		border-left: 1px solid var(--label-border-color) !important;
		border-radius: 3px;
		cursor: pointer;
		flex: 1 0 auto;
		padding: 0 12px;
		user-select: none;
	}
</style>
