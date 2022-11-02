<script lang="ts">
  import cometImage from './assets/comet.png'
  import Counter from './lib/Counter.svelte'
</script>

<main>
  <div>
    <h1>Vite + Svelte + PyScript</h1>
    <img id="glommage" alt="glom comet" src="{cometImage}" />
    <div class="card">
      <Counter />
      <py-script class="yes-test">print('yessss')</py-script>
    </div>

    <div>
      <py-script src="./src/glompad.py"></py-script>
      <py-repl />
    </div>
  </div>
</main>

<style>
.yes-test {
  font-weight: 800;
}

#glommage {
  max-width: 100px;
}
</style>