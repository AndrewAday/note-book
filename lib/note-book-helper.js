exports.getDirectory = function() {
  var path = atom.workspace.getActiveTextEditor().getPath()
  return path.substring(0, path.lastIndexOf('/') + 1)
}
exports.extractUrl = function(mdown) {
  var i = mdown.substring(0,mdown.length-1).lastIndexOf('(')
  return mdown.substring(i+1, mdown.length-1)
}
