import {getAngle, getDistance, getOrbit} from './Trig.js'
function FlexPoint (_x, _y, _range, _growth, _suspendMotion) {
  var suspendMotion = _suspendMotion
  var pointLocation = {x: _x, y: _y}
  var activePointLocation
  var range = _range
  var growth = _growth
  var mousePos = {x: 0, y: 0}
  var easePosition = {x: _x, y: _y}
  this.setMousePos = function (_mousePos) {
    mousePos = _mousePos
  }
  this.reposition = function (_mousePos) {
    mousePos = _mousePos
    if (!suspendMotion) {
      var pAngle = getAngle(mousePos.x, mousePos.y, pointLocation.x, pointLocation.y)
      var avtiveXVal = getOrbit(pointLocation.x, growth, pAngle, 'cos')
      var avtiveYVal = getOrbit(pointLocation.y, growth, pAngle, 'sin')
      activePointLocation = {x: avtiveXVal, y: avtiveYVal}
      var pointToTarget = pointLocation
      if (getDistance(pointLocation.x, pointLocation.y, mousePos.x, mousePos.y) < range) {
        pointToTarget = activePointLocation
      }
      var updatedX = easePosition.x + ((pointToTarget.x - easePosition.x) / 5)
      var updatedY = easePosition.y + ((pointToTarget.y - easePosition.y) / 5)
      easePosition.x = updatedX.toString().toLowerCase() === 'nan' ? easePosition.x : updatedX
      easePosition.y = updatedY.toString().toLowerCase() === 'nan' ? easePosition.y : updatedY
      if (easePosition.x.toString().toLowerCase() === 'nan' || easePosition.y.toString().toLowerCase() === 'nan') {
        alert('Not a Number!!!!!')
      }
    }
  }
  this.getPosition = function () {
    return easePosition
  }
}
export {FlexPoint}
