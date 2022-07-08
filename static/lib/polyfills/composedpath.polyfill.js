// from: https://gist.github.com/rockinghelvetica/00b9f7b5c97a16d3de75ba99192ff05c
// POLYFILLS
// Event.composedPath
// Possibly normalize to add window to Safari's chain, as it does not?
(function(E, d, w) {
  if(!E.composedPath) {
    E.composedPath = function() {
    if (this._path) {
      return this._path;
    }
    var target = this.target;

    this._path = [];
    while (target.parentNode !== null) {
      this._path.push(target);
      target = target.parentNode;
    }
    this._path.push(d, w);
      return this._path;
    }
  }
})(Event.prototype, document, window);
