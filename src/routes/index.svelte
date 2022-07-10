<script>
  import {AbortControllerFast} from '@flemist/abort-controller-fast'

  const abortControllerFast = new AbortControllerFast()
  abortControllerFast.signal.subscribe((reason) => {
    console.log(reason)
  })
  abortControllerFast.abort('Abort controller is working')

  let value = 0
</script>


<p>Main</p>
<p><a href="/dir/page1">Page1</a></p>
<button on:click={() => { value++ }}>Value: {value}</button>
