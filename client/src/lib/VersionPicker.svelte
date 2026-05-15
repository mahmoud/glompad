<script>
  const glompad_meta = window.glompad_meta || {};
  let selected = glompad_meta.version || "dev";
  const all_versions = glompad_meta.all_versions || ["dev", "dev2"];

  $: if (selected && selected !== (glompad_meta.version || "dev")) {
    // Derive the version-independent base from the build-time BASE_URL.
    // e.g. /glompad/v20.0/ -> /glompad/
    const basepath = import.meta.env.BASE_URL;
    const real_basepath = basepath.match(/\/v/)
      ? basepath.slice(0, basepath.indexOf("/", 1) + 1)
      : basepath;

    if (!selected.startsWith("dev")) {
      const new_url = new URL(window.location.toString());
      new_url.pathname = real_basepath + "v" + selected + "/";
      window.location.href = new_url.toString();
    }
  }
</script>

<div id="wrapper">
  <label for="version-picker-select">Version: </label>
  <select
    id="version-picker-select"
    bind:value={selected}
  >
    {#each all_versions as cur_ver}
      <option value={cur_ver}>
        {cur_ver}
      </option>
    {/each}
  </select>
</div>

<style>
  #wrapper {
    display: inline-block;
  }
</style>
