<script>
    import clickOutside from './actions/clickOutside';
    import tooltip from "./actions/tooltip";

    let isOpen = true;
    const closeDrawer = () => (isOpen = false);
    const toggleOpen = () => (isOpen = !isOpen);

    const examples = {
        "Planets Tutorial": 
        '#spec=%7B%0A++%27moons%27%3A+%28%27system.planets%27%2C+%5B%27moons%27%5D%29%2C%0A++%27names%27%3A+%28%27system.planets%27%2C+%5BT%5B%27name%27%5D.title%28%29%5D%29%2C%0A%7D&target=%7B%0A++%27system%27%3A+%7B%0A++++%27planets%27%3A+%5B%0A++++++%7B%27name%27%3A+%27earth%27%2C+%27moons%27%3A+1%7D%2C+%0A++++++%7B%27name%27%3A+%27jupiter%27%2C+%27moons%27%3A+69%7D%0A++++%5D%0A++%7D%0A%7D&v=1',
    };

    import example_info from '../examples.generated.json';
    import VersionPicker from './VersionPicker.svelte';
    import Icon from './Icon.svelte';

</script>

<button on:click|stopPropagation={toggleOpen}>
    {#if isOpen}
    close
    {:else}
    open
    {/if}
</button>

<div 
    use:clickOutside on:outsideclick={closeDrawer} 
    class={isOpen ? 'drawer-open drawer-container' : 'drawer-container'}
>
    <h1 id="title"><a href="{import.meta.env.BASE_URL}#">glompad ☄️ </a></h1>

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
}

 .drawer-container {
   background-color: white;
   position: absolute;
   height: calc(100vh);
   z-index: 10;
   display: flex;
   flex-direction: column;
   padding: 6px;
   width: 300px;
   left: -300px; /* move it off screen when it’s closed */
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