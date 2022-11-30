<script>

const glompad_meta = window.glompad_meta || {};
let selected = glompad_meta.version || 'dev';
const all_versions = glompad_meta.all_versions || ['dev', 'dev2'];

const onVersionChange = (e) => {
    const basepath = import.meta.env.BASE_URL;
    const real_basepath = basepath.match(/\/v/) ? basepath.slice(0, basepath.indexOf('/', 1) + 1) : basepath;
    console.log('basepath: ' + basepath + ' real basepath: ' + real_basepath)

    const version = e.target.value;
    let new_url = new URL(window.location.toString())
    
    new_url.pathname = real_basepath + 'v' + e.target.value + '/';

    window.console.log('changed to ' + version + ' navigating to: ' + new_url.toString());
    if (version.startsWith('dev')) {
        return;
    }
    window.location.href = new_url.toString()
}
</script>

<style>
#wrapper {
    display: inline-block;
}
</style>

<div id="wrapper">
    <label for="version-picker-select">Version: </label>
    <select id="version-picker-select" value={selected} on:change={onVersionChange}>
        {#each all_versions as cur_ver}
            <option value={cur_ver}>
                {cur_ver}
            </option>
        {/each}
    </select>
</div>