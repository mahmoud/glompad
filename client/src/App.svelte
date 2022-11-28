<script lang="ts">
  import Pad from './lib/Pad.svelte'
  const example_url = '#spec=%7B%0A++%27moons%27%3A+%28%27system.planets%27%2C+%5B%27moons%27%5D%29%2C%0A++%27names%27%3A+%28%27system.planets%27%2C+%5BT%5B%27name%27%5D.title%28%29%5D%29%2C%0A%7D&target=%7B%0A++%27system%27%3A+%7B%0A++++%27planets%27%3A+%5B%0A++++++%7B%27name%27%3A+%27earth%27%2C+%27moons%27%3A+1%7D%2C+%0A++++++%7B%27name%27%3A+%27jupiter%27%2C+%27moons%27%3A+69%7D%0A++++%5D%0A++%7D%0A%7D&v=1';
</script>

<py-script src="./src/py/glompad.py"></py-script>
<div id="container">
  <div class="box header">
      <h1>☄️ glompad</h1>
      <p><a href={example_url}>Example</a> | <a href="https://glom.readthedocs.io/en/latest/">Docs</a></p>
  </div>

  <Pad class="box glompad" />

  <div class="box footer">
    <p>(c) Mahmoud Hashemi 2022</p>
  </div>
</div> 
<div>
  <py-repl id="bottom-repl" auto-generate="true"> </py-repl>
</div>

<style>
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
  height: 80px;
}

.footer {
  height: 40px;
  text-align: center;
}

</style>