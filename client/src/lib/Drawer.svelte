<script>
    import clickOutside from './actions/clickOutside';
    import tooltip from "./actions/tooltip";
    import example_info from '../examples.generated.json';
    import VersionPicker from './VersionPicker.svelte';
    import Icon from './Icon.svelte';
    import OptionsMenu from './OptionsMenu.svelte';

    let isWide, isOpen;
    let innerWidth = 0;
    let isOpened = false;
    $: {
        isWide = innerWidth > 1000;
        isOpen = isOpened || isWide;

        if (isOpen) {
            document.body.classList.add('drawer-open')
        } else {
            document.body.classList.remove('drawer-open')
        }
    }
    const closeDrawer = () => (isOpened = false);
    export const toggleOpen = () => (isOpened = !isOpened);

</script>

<!--
<button on:click|stopPropagation={toggleOpen}>
    {#if isOpen}
    close
    {:else}
    open
    {/if}
</button>
-->

<svelte:window bind:innerWidth/>

<div 
    use:clickOutside on:outsideclick={closeDrawer} 
    class={isOpen ? 'drawer-open drawer-container' : 'drawer-container'}
>
    <h1 id="title">
        <span 
            on:click|stopPropagation={closeDrawer}
            on:keydown={closeDrawer}
            style:cursor=pointer
            style:display={isWide ? 'none' : 'initial'}
            role=button>
            <Icon name="arrow-left" stroke="gray" />
        </span> 
        <a href="{import.meta.env.BASE_URL}#">glompad</a>
    </h1>

    <div class="examples-container">
        <h2 class="section-heading">Docs</h2>
        <ul>
            <li>    
                <Icon name='book'/> <a href="https://glom.readthedocs.io/en/latest/" target="_blank">glom docs</a>
            </li>
            <li>
                <Icon name='coffee'/> <a href="https://glom.readthedocs.io/en/latest/tutorial.html" target="_blank">glom Tutorial</a>
            </li>
        </ul>
        <h2 class="section-heading">Examples</h2>
        <ul>
            {#each example_info.example_list as ex}
            <li>
                {#if ex.icon}
                <Icon name={ex.icon} />
                {:else}
                <Icon name='droplet' direction='ne' />
                {/if}
                <a 
                    href="{ex.url}"
                    use:tooltip={{
                        content: ex.desc,
                        disabled: !ex.desc,
                        placement: 'right',
                        delay: [400, 0],
                    }}
                >{ex.label}</a>
            </li>
            {/each}
        </ul>
        <h2 class="section-heading">Options</h2>
        <OptionsMenu withTitle={false} />
    </div>

    <div class='version-picker-container'>
        <VersionPicker />
    </div>
</div>
<div class="{isOpen && !isWide ? "shade" : ""}"></div>
<style>

.shade {
    background: var(--gray-8);
    opacity: 0.5;
    height: 100%;
    width: 100vw;
    position:fixed;
    top: 0;
    left: 0;
    z-index: 2;
    transition: all 0.1s ease-out;
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
    background-color: var(--gray-1);
    position: absolute;
    height: 100vh;
    z-index: 10;
    display: flex;
    flex-direction: column;
    /* padding: 6px; */
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