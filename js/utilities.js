var utilities = {};

// obtains css selector version of a class name
utilities.gS = function(className) {
  return '.' + className;
}

// obtain event namespaced
utilities.gEvtNs = function(eventName) {
  return eventName + '.grid';
}

utilities.getContainerSelector = function(id) {
  return 'js-grid-' + id + '-container';
}

module.exports = utilities;
