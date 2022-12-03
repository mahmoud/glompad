<script lang="ts">
  import Drawer from './lib/Drawer.svelte';
  import Icon from './lib/Icon.svelte';
  import Pad from './lib/Pad.svelte'

  let drawer;
  let innerWidth = 0;
</script>
<svelte:window bind:innerWidth/>


<div id="container">
  <Drawer bind:this={drawer} />
  <div class="box header">
      <h1 id="title">
          <div 
            class="menu-icon-bg"
            on:click|stopPropagation={drawer.toggleOpen}
            on:keydown|stopPropagation={drawer.toggleOpen}
            >
            <Icon name="menu" stroke="gray" />
          </div> 
        <a href="{import.meta.env.BASE_URL}#">
          glompad
        </a>
      </h1>  
  </div>

  <Pad class="box glompad" />

  <div class="box footer">
    <!-- svelte-ignore security-anchor-rel-noreferrer -->
    <a href="https://github.com/mahmoud/glom" target="_blank"><Icon name="github"/></a>
    <!-- svelte-ignore security-anchor-rel-noreferrer -->
    <a href="https://glom.readthedocs.io/en/latest/" target="_blank"><Icon name="book-open"/></a>
  </div>
</div> 
<div>
  <py-repl id="bottom-repl" auto-generate="true"> </py-repl>
</div>

<style>

h1 {
  user-select: none;
}

#title * {
  text-decoration: none;
  color: black;
}

.menu-icon-bg :global(*) { 
  margin: 0 auto;
}

.menu-icon-bg {
  cursor: pointer;
  border-radius: 50%;
  background: lightgray;
  width: 38px;
  height: 36px;
  top: 11px;
  display: inline-block;
  vertical-align: middle;
  overflow: hidden;
  text-align: center;
  text-decoration: none;
  transition: color .15s ease, background .15s ease;
  font-size: 70%;
  padding: 4px 2px;
}

.menu-icon-bg:hover {
  background: silver;
}

#container {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 100%;
}

#container > div {
  background-color: #efefef;
}

.box {
  display: flex;
  flex-direction: column;
}

:global(.glompad) {
  margin: 0 0.5rem;
  padding: 0.5rem;
  background: #fff;
  flex: 1;
}

.header {
  height: 50px;
  padding-left: 10px;
}

.footer {
  height: 40px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  padding-top: 10px;
}

.footer * {
  margin: 0 5px 0 5px;
}

</style>