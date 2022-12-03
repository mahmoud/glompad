<script>
    import clickOutside from './actions/clickOutside';
    import tooltip from "./actions/tooltip";
    import example_info from '../examples.generated.json';
    import VersionPicker from './VersionPicker.svelte';
    import Icon from './Icon.svelte';

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

    <a href="https://glom.readthedocs.io/en/latest/">glom docs</a>

    <div class="examples-container">
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
    </div>

    <div class='version-picker-container'>
        <VersionPicker />
    </div>
</div>
<style>
h1 > a {
    text-decoration: none;
    color: black;
    user-select: none;
}

 .drawer-container {
   background-color: white;
   position: absolute;
   height: calc(100vh);
   z-index: 10;
   display: flex;
   flex-direction: column;
   padding: 6px;
   width: 250px;
   left: -250px; /* move it off screen when it’s closed */
   transition: left 0.1s ease-out;
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
    color: #555;
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
 }
</style>