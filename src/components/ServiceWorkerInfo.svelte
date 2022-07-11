<script>
  import { version, files, build, prerendered } from '$service-worker'
</script>

<div class="service-worker-info">
  <div class="service-worker-info__version">{version}</div>
  <ul class="service-worker-info__urls">
    {#each [...files, ...build, ...prerendered] as url}
      <li class="service-worker-info__url">{url}</li>
    {/each}
  </ul>
</div>
