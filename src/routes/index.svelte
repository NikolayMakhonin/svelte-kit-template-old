<script>
  import {AbortControllerFast} from '@flemist/abort-controller-fast'

  const abortControllerFast = new AbortControllerFast()
  abortControllerFast.signal.subscribe((reason) => {
    console.log(reason)
  })
  abortControllerFast.abort('Abort controller is working')

  let value = 0
</script>

<h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to read the documentation</p>
<button on:click={() => { value++ }}>Value: {value}</button>
