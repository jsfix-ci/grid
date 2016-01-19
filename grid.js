var $ = require('jquery');
var mustache = require('mustache');
var keyCode = require('codex/keyCode');
var mustacheTemplates = {
  grid: $('#mst-grid').html(),
  rows: $('#mst-grid-rows').html(),
  input: $('#mst-grid-input').html(),
  select: $('#mst-grid-select').html()
};


var Grid = function () {};


Grid.prototype.create = function(options) {
  var defaults = {
    onSelectTd: function() {},
    onSelectTr: function() {},
  };
  this.options = $.extend(defaults, options);
  this.$container = $(this.options.containerSelector);
  this.selectedClass = 'is-selected';
  this.colKeys = [];
  this.colsWithKeys = [];

  // events
  // selecting a cell
  this.$container.on('click', '.js-grid-td', this, this.selectTd);

  // get keys
  for (var key in this.options.cols) {
    this.colKeys.unshift(key);
  }

  // add key to cols
  for (var index = this.colKeys.length - 1; index >= 0; index--) {
    var colKey = this.colKeys[index];
    this.options.cols[colKey].key = colKey;
    this.colsWithKeys.push(this.options.cols[colKey]);
  };

  // put grid container in dom
  this.$container.html(mustache.render(mustacheTemplates.grid, this.colsWithKeys));

  // get initial data
  var rows = [
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]
  ];

  // store initial data
  this.$container.find('.js-grid-row-heading').after(mustache.render(mustacheTemplates.rows, rows));
};


Grid.prototype.getModel = function(event, index) {
  return event.data.options.cols[event.data.$container.find('.js-grid-th').eq(index).data('key')]
};


// deselect with classes
// must resolve persistence, does this row need saving?
Grid.prototype.rowDeselect = function(event) {
  var selectedTr = event.data.$container.find('tr.is-selected');
  if (!selectedTr.length) {
    return;
  };

  selectedTr.removeClass(event.data.selectedClass);

  var selectedTd = selectedTr.find('.' + event.data.selectedClass);
  if (!selectedTd.length) {
    return;
  };

  selectedTd
    .removeClass(event.data.selectedClass)
    .html(selectedTd.find('.js-grid-td-input').val());

  // perform persist update
  var data = {id: 'how to find id of row?', 'key of col': 'new value'};
  $.ajax({
    type: 'get',
    url: event.data.url.update,
    dataType: 'json',
    data: {
      : value
    },
    success: function(response) {
      // change the field to the new val
    },
    error: function(response) {
      // set the field back to what it was originally
    }
  });
  
};


// switch the data out with an input / select
Grid.prototype.selectTd = function(event) {
  var $this = $(this);
  var model = event.data.getModel(event, $this.index());
  var type = 'type' in model ? model.type : 'text';
  var template;
  var data = [];

  if ($this.hasClass(event.data.selectedClass)) {
    return;
  };

  event.data.rowDeselect(event);
  
  // selecting cell and row
  $this
    .addClass(event.data.selectedClass)
    .parent('tr').addClass(event.data.selectedClass);
  event.data.options.onSelectTd.call(event);

  if ('edit' in model) {
    return;
  };

  // store template and data
  if (type == 'select') {
    template = mustacheTemplates.select;
    for (var key in model.selectOptions) {
      data.push({key: key, value: model.selectOptions[key]});
    }
  } else {
    template = mustacheTemplates.input;
    data = {type: type, value: $this.html()};
  };

  $this.html(mustache.render(template, data));
};


module.exports = Grid;
