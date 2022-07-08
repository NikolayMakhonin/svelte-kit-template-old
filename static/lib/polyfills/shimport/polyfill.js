try {
  new Function("if(0)import('')")();
} catch (e) {
  var scripts = document.querySelectorAll('script[type=module]');
  for (var i = 0; i < scripts.length; i++){
    var script = scripts[i];
    var newScript = document.createElement("script");
    var attributes = script.attributes;
    for (var j = 0; j < attributes.length; j++){
      var attribute = attributes[j];
      if (attribute.name !== 'type') {
        newScript.setAttribute(attribute.name, attribute.value);
      }
    }
    var blob = new Blob([script.innerText], {
      type: 'application/javascript'
    });
    newScript.setAttribute("data-main", URL.createObjectURL(blob));
    newScript.src = "/lib/polyfills/shimport/shimport@2.0.5.dev.js";

    script.parentNode.insertBefore(newScript, script);
    script.remove();
  }
}
