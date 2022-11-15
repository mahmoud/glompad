<script lang="ts">
  import Pad from './lib/Pad.svelte'
  const example_url = 'http://localhost:5173/#spec=%7B%0A++%27moons%27%3A+%28%27system.planets%27%2C+%5B%27moons%27%5D%29%2C%0A++%27names%27%3A+%28%27system.planets%27%2C+%5BT%5B%27name%27%5D.title%28%29%5D%29%2C%0A%7D&target=%7B%0A++%27system%27%3A+%7B%0A++++%27planets%27%3A+%5B%0A++++++%7B%27name%27%3A+%27earth%27%2C+%27moons%27%3A+1%7D%2C+%0A++++++%7B%27name%27%3A+%27jupiter%27%2C+%27moons%27%3A+69%7D%0A++++%5D%0A++%7D%0A%7D&v=1';
</script>

<main>
  <py-script src="./src/glompad.py"></py-script>
  <div id="container">
    <div class="header">
        <h1>☄️ glompad</h1>
        <p><a href={example_url}>Example</a></p>
    </div>

    <Pad class="glompad" />

    <div class="footer">
      <p>(c) Mahmoud Hashemi 2022</p>
    </div>
  </div> 
  <div>
    <py-repl id="bottom-repl" auto-generate="true"> </py-repl>
  </div>
</main>

<style>
#container {
  background: #efefef;
  display: grid;
  gap: 0.5em;
  grid-template-columns: 2fr;
  grid-template-rows: 80px 1fr 40px;
  grid-template-areas: "header"
                       "glompad"
                       "footer";
}

#container > div {
  background-color: #efefef;
}

:global(.glompad) {
  margin: 0 0.5rem;
  padding: 0.5rem;
  background: #fff;
}

.header {
  grid-area: header;
}

.footer {
  grid-area: footer;
  text-align: center;
}

</style>