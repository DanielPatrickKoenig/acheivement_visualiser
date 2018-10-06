function getDistance (x1, y1, x2, y2) {
  var distx = x2 - x1
  var disty = y2 - y1
  return Math.sqrt(Math.pow(distx, 2) + Math.pow(disty, 2))
}
function getAngle (x1, y1, x2, y2) {
  var distx = x2 - x1
  var disty = y2 - y1
  var masterdist = getDistance(x1, y1, x2, y2)
  var primaryAnglex = distx / masterdist
  var anglex = Math.asin(primaryAnglex) * 180 / Math.PI
  var primaryAngley = disty / masterdist
  var angley = Math.asin(primaryAngley) * 180 / Math.PI
  var resultVal
  if (disty < 0) {
    resultVal = anglex
  } else if (disty >= 0 && distx >= 0) {
    resultVal = angley + 90
  } else if (disty >= 0 && distx < 0) {
    resultVal = (angley * -1) - 90
  }
  return resultVal
}
function getOrbit (_center, _radius, _angle, orbitType) {
  var _num1 = _center
  var _num2 = _radius
  var _num3 = _angle
  var theCent = _num1
  var radius = _num2
  var angle = _num3 - 90
  var ot = orbitType
  var resultVal
  if (ot === 'cos') {
    resultVal = theCent + (Math.cos((angle) * (Math.PI / 180)) * radius)
  }
  if (ot === 'sin') {
    resultVal = theCent + (Math.sin((angle) * (Math.PI / 180)) * radius)
  }
  return resultVal
}
function lightenDarkenColor (col, amt) {
  var usePound = false
  if (col[0] === '#') {
    col = col.slice(1)
    usePound = true
  }
  var num = parseInt(col, 16)
  var r = (num >> 16) + amt
  if (r > 255) r = 255
  else if (r < 0) r = 0
  var b = ((num >> 8) & 0x00FF) + amt
  if (b > 255) b = 255
  else if (b < 0) b = 0
  var g = (num & 0x0000FF) + amt
  if (g > 255) g = 255
  else if (g < 0) g = 0
  return (usePound ? '#' : '') + (g | (b << 8) | (r << 16)).toString(16)
}
function componentToHex (c) {
  var hex = c.toString(16)
  return hex.length === 1 ? '0' + hex : hex
}
function rgbToHex (r, g, b) {
  return '#' + componentToHex(r) + componentToHex(g) + componentToHex(b)
}
function hexToRgb (hex) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null
}
function getIntersection (_tl, _tr, _br, _bl, double) {
  if (double) {
    _tr.x *= 2
    _tr.y *= 2
    _br.x *= 2
    _br.y *= 2
    _bl.x *= 2
    _bl.y *= 2
  }
  var a1 = _br.y - _tl.y
  var b1 = _tl.x - _br.x
  var a2 = _bl.y - _tr.y
  var b2 = _tr.x - _bl.x
  var denom = a1 * b2 - a2 * b1
  var c1 = _br.x * _tl.y - _tl.x * _br.y
  var c2 = _bl.x * _tr.y - _tr.x * _bl.y
  var p = {x: (b1 * c2 - b2 * c1) / denom, y: (a2 * c1 - a1 * c2) / denom}
  return p
}
export {getDistance, getAngle, getOrbit, getIntersection, lightenDarkenColor, rgbToHex, hexToRgb}
