<script lang="ts">
  import Pad from './lib/Pad.svelte'
</script>

<main>
  <py-script src="./src/glompad.py"></py-script>
  <div id="container">
    <div class="header">
        <h1>☄️ glompad</h1>
    </div>

    <Pad />

    <div id="glom-ref-container">
      <h3>Reference</h3>
      <ul>
        <li><code>glom(target, 'a.b.c')</code></li>
      </ul>
    </div>

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
  display: grid;
  gap: 0.5em;
  grid-template-columns: 2fr 1fr;
  grid-template-rows: 100px 1fr 100px;
  grid-template-areas: "header header"
                       "glompad glomref"
                       "footer footer";
}

#container > div {
  background-color: lightsteelblue;
}


.header {
  grid-area: header;
}

.footer {
  grid-area: footer;
}

</style>