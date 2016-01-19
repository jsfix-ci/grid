var $ = require('jquery');
var mustache = require('mustache');
var keyCode = require('codex/keyCode');
var mustacheTemplates = {
  grid: $('#mst-grid').html(),
  rows: $('#mst-grid-rows').html(),
  input: $('#mst-grid-input').html(),
  select: $('#mst-grid-select').html()
};


// obtains css selector version of a class name
function gS (className) {
  return '.' + className;
}


// obtain event namespaced
function gEvtNs (eventName) {
  return eventName + '.grid';
}


var Grid = function () {
  this.selectedClass = 'is-selected';
  this.cellHeadingClass = 'js-grid-cell-heading';
  this.rowClass = 'js-grid-row';
  this.rowHeadingClass = 'js-grid-row-heading';
  this.cellClass = 'js-grid-cell';
  this.inputClass = 'js-grid-cell-input';
};


Grid.prototype.create = function(options) {
  var defaults = {
    onSelectTd: function() {},
    onSelectTr: function() {},
  };
  this.options = $.extend(defaults, options);

  this.$container = $(this.options.containerSelector);

  this.setEvents();
  this.storeInitialData();

  // put grid container in dom
  this.$container.html(mustache.render(mustacheTemplates.grid, this.options.cols));

  // get initial data
  var rows = [
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
    [2, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
    [3, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
    [4, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]
  ];

  // store initial data
  this.$container.find(gS('js-grid-row-heading')).after(mustache.render(mustacheTemplates.rows, rows));
};


Grid.prototype.storeInitialData = function() {

  // extract primary key and store
  for (var index = this.options.cols.length - 1; index >= 0; index--) {
    if ('primaryKey' in this.options.cols[index]) {
      this.primaryKey = this.options.cols[index].key;
    };
  };
};


Grid.prototype.setEvents = function() {

  // selecting a cell
  // this.$container.on(gEvtNs('mouseup'), gS(this.cellClass), this, this.cellSelect);

  // clicking the document
  // could be a cell or row!
  $(document).on(gEvtNs('mouseup'), this, this.mouseupDocument);
};


Grid.prototype.mouseupDocument = function(event) {
  $target = $(event.target);

  // no target
  if (!$target.length) {
    return event.data.cellDeselect();
  };
  
  // is cell and selected
  if ($target.hasClass(event.data.cellClass) && $target.hasClass(event.data.selectedClass)) {
    return;
  };

  // is cell and not selected
  // deselect then select
  if ($target.hasClass(event.data.cellClass)) {
    event.data.cellDeselect(event);
    event.data.cellSelect(event, $target);
  };
};


Grid.prototype.getModelByIndex = function(event, index) {
  var thKey = event.data.$container.find(gS(event.data.cellHeadingClass)).eq(index).data('key');
  var model;
  for (var index = event.data.options.cols.length - 1; index >= 0; index--) {
    model = event.data.options.cols[index];
    if (model.key == thKey) {
      return model;
    };
  };
};


Grid.prototype.getModelByKey = function(event, key) {
  var model;
  for (var index = event.data.options.cols.length - 1; index >= 0; index--) {
    model = event.data.options.cols[index];
    if (model.key == key) {
      return model;
    };
  };
};


// deselect with classes
Grid.prototype.rowDeselect = function(event) {
  var $selectedRow = event.data.$container.find(gS(event.data.rowClass) + gS(event.data.selectedClass));

  if (!$selectedRow.length) {
    return;
  };

  $selectedRow.removeClass(event.data.selectedClass);  
};


// deselect cell and persist
Grid.prototype.cellDeselect = function(event) {
  var $selectedRow = event.data.$container.find(gS(event.data.rowClass) + gS(event.data.selectedClass));

  if (!$selectedRow.length) {
    return;
  };

  var primaryKeyValue = event.data.getSelectedRowPrimaryHtml(event);

  event.data.rowDeselect(event);

  var $selectedCell = $selectedRow.find(gS(event.data.cellClass) + gS(event.data.selectedClass));

  $selectedCell.removeClass(event.data.selectedClass);

  if (!$selectedCell.length) {
    return;
  };

  var model = event.data.getModelByIndex(event, $selectedCell.index());

  // not editable
  if ('edit' in model && !model.edit) {
    return;
  };

  var $selectedCellInput = $selectedCell.find(gS(event.data.inputClass));
  var newValue = $selectedCellInput.val();

  // get selected option html
  var type = event.data.getInputTypeFromModel(model);
  var cellHtml;

  // select needs to get the display name from the key
  if (type == 'select') {
    for (var key in model.selectOptions) {
      if (key == newValue) {
        cellHtml = model.selectOptions[key];
      };
    };

  // store the new value in data
  // put in html the display name of it
  } else {
    cellHtml = newValue;
  };

  // store inside data
  $selectedCell
    .data('value', newValue)
    .html(cellHtml);

  // perform persist update
  data = {};
  data[event.data.primaryKey] = primaryKeyValue;
  data[model.key] = newValue;

  return console.log('updating row with', data);

  // $.ajax({
  //   type: 'get',
  //   url: event.data.url.update,
  //   dataType: 'json',
  //   data: {
  //     // : value
  //   },
  //   success: function(response) {
  //     // change the field to the new val
  //   },
  //   error: function(response) {
  //     // set the field back to what it was originally
  //   }
  // });
};


// returns the selected row primary value
Grid.prototype.getSelectedRowPrimaryHtml = function(event) {
  var $selectedRow = event.data.$container.find(gS(event.data.rowClass) + gS(event.data.selectedClass));
  var $selectedCell = $selectedRow.find(gS(event.data.cellClass) + gS(event.data.selectedClass));
  var $primaryHeadingCell = $(gS(event.data.cellHeadingClass) + '[data-key="' + event.data.primaryKey + '"]');
  var $primaryCell = $selectedRow.find(gS(event.data.cellClass)).eq($primaryHeadingCell.index());
  return $primaryCell.html();
};


// using model get the input type
Grid.prototype.getInputTypeFromModel = function(model) {
  if ('selectOptions' in model) {
    return 'select';
  } else if ('type' in model) {
    return model.type;
  } else {
    return 'text';
  };
};


Grid.prototype.selectRowByCell = function(event, $cell) {

  // deselect all rows
  event.data.$container
    .find(gS(event.data.rowClass))
    .removeClass(event.data.selectedClass);

  // select row closest to cell
  $cell
    .closest(gS(event.data.rowClass))
    .addClass(event.data.selectedClass);
};


// switch the data out with an input / select
Grid.prototype.cellSelect = function(event, $cell) {
  var template;
  var data = [];
  $cell.addClass(event.data.selectedClass);

  event.data.selectRowByCell(event, $cell);

  var $row = $cell.closest(gS(event.data.rowClass));

  var model = event.data.getModelByIndex(event, $cell.index());

  var type = event.data.getInputTypeFromModel(model);

  // optional select td call
  event.data.options.onSelectTd.call();

  // not editable
  if ('edit' in model && !model.edit) {
    return;
  };

  // replace html for input using data value
  if (type == 'select') {
    template = mustacheTemplates.select;
    for (var key in model.selectOptions) {
      data.push({
        keySelected: $cell.data('value') == key,
        key: key,
        value: model.selectOptions[key]
      });
    }
  } else {
    template = mustacheTemplates.input;
    data = {type: type, value: $cell.data('value')};
  };
  $cell
    .html(mustache.render(template, data))
    .find(gS(event.data.inputClass))
    .focus()
    .select();
};


module.exports = Grid;
