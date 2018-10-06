function arrayContains (arr, item) {
  var contains = false
  for (var i = 0; i < arr.length; i++) {
    if (arr[i] === item) {
      contains = true
    }
  }
  return contains
}
function debugTrace (message) {
  console.log('DEBUGGER: ' + message)
}
export {arrayContains, debugTrace}
