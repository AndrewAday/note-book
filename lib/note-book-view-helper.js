exports.create_image = function(src, alt, title) {
  var img = document.createElement('img')
  img.src = src
  if (alt != null) img.alt = alt
  if (title != null) img.title = title
  return img
}
