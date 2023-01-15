<script>
  import clickOutside from "./actions/clickOutside";
  import tooltip from "./actions/tooltip";
  import example_info from "../examples.generated.json";
  import VersionPicker from "./VersionPicker.svelte";
  import Icon from "./Icon.svelte";
  import OptionsMenu from "./OptionsMenu.svelte";
  import Modal from "./Modal.svelte";
  import { padStore } from "./stores";
  import Link from "./Link.svelte";

  const { enableDebug } = padStore;

  let isWide, isOpen;
  let innerWidth = 0;
  let isOpened = false;
  let visible_examples = [],
    example_sections = {};
  $: {
    isWide = innerWidth > 1000;
    isOpen = isOpened || isWide;

    if (isOpen) {
      document.body.classList.add("drawer-open");
    } else {
      document.body.classList.remove("drawer-open");
    }

    visible_examples = example_info.example_list.filter(
      (ex) => $enableDebug || !ex.section.match(/debug/i)
    );
    example_sections = bucketize(visible_examples, "section");
  }
  const closeDrawer = () => (isOpened = false);
  export const toggleOpen = () => (isOpened = !isOpened);

  const bucketize = (list, key) => {
    let ret = {};
    let cur_key_val, cur_list;
    for (let i = 0; i < list.length; i++) {
      cur_key_val = list[i][key];
      cur_list = ret[cur_key_val] ?? [];
      cur_list.push(list[i]);
      ret[cur_key_val] = cur_list;
    }
    return ret;
  };

  function testSentry() {
    if (import.meta.env.PROD) {
      throw new Error("production Sentry test");
    } else {
      throw new Error("local Sentry test");
    }
  }

  let show_about = false;
</script>

<svelte:window bind:innerWidth />

<div
  use:clickOutside
  on:outsideclick={closeDrawer}
  class={isOpen ? "drawer-open drawer-container" : "drawer-container"}
>
  <h1 id="title">
    <span
      on:click|stopPropagation={closeDrawer}
      on:keydown={closeDrawer}
      style:cursor="pointer"
      style:display={isWide ? "none" : "initial"}
      role="button"
    >
      <Icon name="arrow-left" stroke="gray" />
    </span>
    <a href="{import.meta.env.BASE_URL}#">glompad</a>
  </h1>

  <div class="examples-container">
    <h2 class="section-heading">Docs</h2>
    <ul>
      <li>
        <Icon name="book" />
        <!-- svelte-ignore security-anchor-rel-noreferrer -->
        <a href="https://glom.readthedocs.io/en/latest/" target="_blank"
          >glom Docs</a
        >
      </li>
      <li>
        <Icon name="coffee" />
        <!-- svelte-ignore security-anchor-rel-noreferrer -->
        <a
          href="https://glom.readthedocs.io/en/latest/tutorial.html"
          target="_blank">glom Tutorial</a
        >
      </li>
      <li>
        <Icon name="info" />
        <a
          href="#show=about"
          on:click|preventDefault={() => {
            show_about = true;
          }}>About</a
        >
      </li>
    </ul>
    {#each Object.entries(example_sections) as [title, examples]}
      <h2 class="section-heading">{title}</h2>
      <ul>
        {#each examples as ex}
          <li>
            {#if ex.icon}
              <Icon name={ex.icon} />
            {:else}
              <Icon name="droplet" direction="ne" />
            {/if}
            <a
              href={ex.url}
              use:tooltip={{
                content: ex.desc,
                disabled: !ex.desc,
                placement: "right",
                delay: [400, 0],
              }}>{ex.label}</a
            >
          </li>
        {/each}
      </ul>
    {/each}
    {#if $enableDebug}
      <!-- svelte-ignore missing-declaration -->
      <button type="button" on:click={testSentry}>Test Sentry</button>
    {/if}
    <h2 class="section-heading">Options</h2>
    <OptionsMenu withTitle={false} />
  </div>

  <div class="version-picker-container">
    <VersionPicker />
  </div>
</div>
<div class={isOpen && !isWide ? "shade" : ""} />

{#if show_about}
  <Modal on:close={() => (show_about = false)}>
    <h2 slot="header">About glompad</h2>
    <p>
      glompad is a sandbox for experimenting with and prototyping
      <Link href="https://github.com/mahmoud/glom">glom</Link>
      specs in the spirit of
      <Link href="https://jsfiddle.net/">JSFiddle</Link>
      and
      <Link href="https://codepen.io/">Codepen</Link>.
    </p>
    <p>
      glompad is built on top of
      <Link href="https://pyscript.net">PyScript</Link>/
      <Link href="https://pyodide.org">Pyodide</Link>, a
      <Link href="https://webassembly.org/">WebAssembly</Link>
      implementation of Python.
    </p>
    <p>
      That means this is the real glom, just as you would
      <code>pip install</code> from
      <Link href="https://pypi.org/project/glom">PyPI</Link>, running in your
      browser.
    </p>
  </Modal>
{/if}

<style>
  .shade {
    background: #000; /* var(--gray-8);*/
    opacity: 0.7;
    height: 100%;
    width: 100vw;
    position: fixed;
    top: 0;
    left: 0;
    z-index: 2;
    transition: all 0.15s ease-out;
  }

  h1 > a {
    text-decoration: none;
    user-select: none;
    color: var(--primary-color-8);
  }

  h1 {
    font-weight: 500;
    font: monospace;
    letter-spacing: -1.5px;
    padding: 0;
  }

  .drawer-container {
    background-color: var(--gray-0);
    position: absolute;
    height: 100vh;
    z-index: 10;
    display: flex;
    flex-direction: column;
    padding: 6px;
    width: 250px;
    left: -250px; /* move it off screen when it’s closed */
    transition: left 0.1s ease-out;
    border-right: 2px solid var(--primary-color-2);
  }

  .drawer-container * {
    width: 100%;
  }

  .examples-container {
    flex-grow: 1;
  }

  .drawer-open {
    left: 0; /* move it on screen when it’s open */
  }

  .section-heading {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 0.95rem;
    border-bottom: 1px solid silver;
    text-transform: uppercase;
    color: var(--gray-8);
    padding-bottom: 3px;
    user-select: none;
    margin-right: auto;
    flex: 1;
  }

  .version-picker-container {
    align-self: flex-end;
  }

  .examples-container ul {
    list-style: none;
    margin-left: 0;
    padding-left: 0;
    margin-bottom: 16px;
  }
</style>
