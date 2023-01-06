<script>
  import feather from "feather-icons";
  export const directions = ["n", "ne", "e", "se", "s", "sw", "w", "nw"];

  export let name;
  export let direction = "n";
  export let strokeWidth = null;
  export let stroke = null;
  export let width = "1em";
  export let height = "1em";

  let icon, rotation;

  $: {
    if (name == "diamond") {
      icon = feather.icons["square"];
      rotation = 45;
    } else {
      icon = feather.icons[name];
      rotation = directions.indexOf(direction) * 45;
    }
    if (icon) {
      if (stroke) icon.attrs["stroke"] = stroke;
      if (strokeWidth) icon.attrs["stroke-width"] = strokeWidth;
    }
  }
</script>

{#if icon}
  <svg
    {...icon.attrs}
    style:width
    style:height
    style:transform="rotate({rotation}deg)"
    style:display="inline"
  >
    <g>
      {@html icon.contents}
    </g>
  </svg>
{/if}

<style>
  svg {
    width: 1em;
    height: 1em;
    overflow: visible;
    transform-origin: 50% 50%;
    margin-bottom: -0.15em;
  }
</style>
