<script lang="ts">
  import Pad from './lib/Pad.svelte'
</script>

<main>
  <py-script src="./src/glompad.py"></py-script>
  <div id="container">
    <div class="header">
        <h1>☄️ glompad</h1>
    </div>

    <Pad class="glompad" />

    <div class="footer">
      <p><a href='{`#spec={"d"%3A+"a.b.c"}&target={'a'%3A+{'b'%3A+{'c'%3A+'d'}}}&v=1`}'>Example</a></p>
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
  grid-template-columns: 2fr;
  grid-template-rows: 100px 1fr 100px;
  grid-template-areas: "header"
                       "glompad"
                       "footer";
}

#container > div {
  background-color: lightsteelblue;
}

:global(.glompad) {
  padding: 0 15px;
}

.header {
  grid-area: header;
}

.footer {
  grid-area: footer;
}

</style>