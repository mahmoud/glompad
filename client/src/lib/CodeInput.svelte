<script>
	// TODO: factor out tooltip, popover, add clickOutside closing of modal

	import CodeMirror from "svelte-codemirror-editor";
  
	import { python } from "@codemirror/lang-python";
	import { keymap } from "@codemirror/view";
  
	import { createPopperActions } from "svelte-popperjs";

	import tooltip from './actions/tooltip'
	import { padStore } from './stores';

	
	let curVal = "first";
	let count = 0;
  
	function optsClick(event) {
	  count += 1;
	  curVal = "opts clicked " + count;
	  showMenu = !showMenu;
	}
	
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
  
	const [popperRef, popperContent] = createPopperActions({
	  placement: "right",
	  strategy: "fixed"
	});
	const extraOpts = {
	  modifiers: [{ name: "offset", options: { offset: [0, 8] } }]
	};
  
	let showTooltip = false;
	let showMenu = false;
  </script>
  
  <style>
	  .padInput :global(.cmwrap) {
		background: lightgray;
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
		font-family: inherit;
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
		cursor: pointer;
		color: #555;
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
		border-top-right-radius: 3px;
		cursor: pointer;
		flex: 1 0 auto;
		padding: 0 12px;
		-webkit-user-select: none;
		-moz-user-select: none;
		user-select: none;
	  }
  
	  #tooltip {
		background: #333;
		color: white;
		font-weight: bold;
		padding: 4px 8px;
		font-size: 13px;
		border-radius: 4px;
	  }
  
	  #arrow,
	  #arrow::before {
		position: absolute;
		width: 8px;
		height: 8px;
		background: inherit;
	  }
  
	  #arrow {
		visibility: hidden;
	  }
  
	  #arrow::before {
		visibility: visible;
		content: "";
		transform: rotate(45deg);
	  }
  
	  :global(#tooltip[data-popper-placement^="top"]) > #arrow {
		bottom: -4px;
	  }
  
	  :global(#tooltip[data-popper-placement^="bottom"]) > #arrow {
		top: -4px;
	  }
  
	  :global(#tooltip[data-popper-placement^="left"]) > #arrow {
		right: -4px;
	  }
  
	  :global(#tooltip[data-popper-placement^="right"]) > #arrow {
		left: -4px;
	  }
  </style>
  
  
  <!------html-->
  
  <p>{curVal}</p>
  
  <div class="padInput">
	<div class="optsButton" role="button" tabindex="0" 
		  on:click={optsClick}   
		  use:tooltip={{
			content: 'yo',
			placement: 'right'
		}}
	  >
		  <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 192 512" height="12" width="12" xmlns="http://www.w3.org/2000/svg"><path d="M96 184c39.8 0 72 32.2 72 72s-32.2 72-72 72-72-32.2-72-72 32.2-72 72-72zM24 80c0 39.8 32.2 72 72 72s72-32.2 72-72S135.8 8 96 8 24 40.2 24 80zm0 352c0 39.8 32.2 72 72 72s72-32.2 72-72-32.2-72-72-72-72 32.2-72 72z"></path></svg>
	  </div>
  
	  <CodeMirror 
		  bind:value={$specValue} 
		  class="cmwrap"
		  lang={python()} 
		  extensions={[ctrlEnterKeymap]} 
		  basic={false} 
		  styles={{
			  "&": {
					  "max-width": "500px",
					  "min-width": "100px"
			  },
		  }}
	  />
	  <button class="copyButton">Clip</button>
  
  
	  {#if showTooltip && false}
		  <div id="tooltip" use:popperContent={extraOpts}>
			  Options
			  <div id="arrow" data-popper-arrow />
		  </div>
	  {/if}
	  {#if showMenu}
		  <div id="optionsMenu">
			  Menu
		  </div>
	  {/if}
  </div>
  
