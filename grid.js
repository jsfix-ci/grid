var $ = require('jquery');
var mustache = require('mustache');
var keyCode = {};
var mustacheTemplates = {
  grid: $('#mst-grid').html(),
  rows: $('#mst-grid-rows').html(),
  input: $('#mst-grid-input').html(),
  select: $('#mst-grid-select').html()
};
var dialogueFactory = require('dialogue');
var dialogueCreate = new dialogueFactory();
var timeoutId;


// obtains css selector version of a class name
function gS (className) {
  return '.' + className;
}


// obtain event namespaced
function gEvtNs (eventName) {
  return eventName + '.grid';
}


function getContainerSelector (id) {
  return 'js-grid-' + id + '-container';
}


var Grid = function () {
  this.selectedClass = 'is-selected';
  this.cellHeadingClass = 'js-grid-cell-heading';
  this.rowClass = 'js-grid-row';
  this.rowHeadingClass = 'js-grid-row-heading';
  this.cellClass = 'js-grid-cell';
  this.inputClass = 'js-grid-cell-input';
  this.searchInputClass = 'js-grid-search-input';
};


Grid.prototype.create = function(options) {
  var defaults = {
    onSelectCell: function() {},
    onSelectRow: function() {},
  };
  this.options = $.extend(defaults, options);

  this.$container = $(gS(getContainerSelector(this.options.id)));

  // put grid container in dom
  this.$container.html(mustache.render(mustacheTemplates.grid, this.options.cols));

  this.setEvents({data: this});
  this.storeInitialData();

  this.read({data: this}, {});
};


Grid.prototype.read = function(event, data) {

  // builds an object to understand
  // any search key > val (id -> 10002)
  // any order asc / desc (id -> asc)
  // page requested
  // how many per page (20, 40)
  // var data = {};

  // clear out old rows
  event.data.$container
    .find(gS(event.data.rowClass))
    .remove();

  // get new fun rows
  $.ajax({
    type: 'get',
    url: event.data.options.url.read,
    dataType: 'json',
    data: data,
    success: function(response) {
      if (
        typeof response.rowsTotal === 'undefined'
        || typeof response.rows === 'undefined'
        || typeof response.pageCurrent === 'undefined'
        || typeof response.rowsPerPage === 'undefined'
      ) {
        return console.warn('read response malformed', response);
      };
      event.data.$container.find(gS('js-grid-row-heading')).after(mustache.render(mustacheTemplates.rows, response.rows));

      // get back
      // current page #
      // total possible pages
      // rows
    },
    error: function(response) {
      return console.warn('problem with read request');
    }
  });
};


Grid.prototype.storeInitialData = function() {

  // extract primary key and store
  for (var index = this.options.cols.length - 1; index >= 0; index--) {
    if ('primaryKey' in this.options.cols[index]) {
      this.primaryKey = this.options.cols[index].key;
    };
  };
};


Grid.prototype.setEvents = function(event) {

  // selecting a cell
  // this.$container.on(gEvtNs('mouseup'), gS(this.cellClass), this, this.cellSelect);

  // clicking the document
  // could be a cell or row!
  event.data.$container.on('mousedown.grid-' + event.data.options.id, event.data, event.data.mouseDocument);

  // search input
  event.data.$container.on('keyup.grid-' + event.data.options.id, gS(event.data.searchInputClass), event.data, event.data.keySearchInput);

  // search input
  event.data.$container.on('mousedown.grid-' + event.data.options.id, gS(event.data.searchInputClass), event.data, function (event) {
    event.stopPropagation();
  });

  // order column
  event.data.$container.on('mousedown.grid-' + event.data.options.id, gS(event.data.cellHeadingClass), event.data, event.data.mouseHeadingCell);

  event.data.$container.on('click.grid-' + event.data.options.id, gS('js-grid-button-create'), event.data, function(event) {

    dialogueCreate.create({
      mask: true,
      className: 'dialogue-grid-create',
      width: 300,
      title: 'Create',
      actions: {
        'Cancel': function() {
          this.close();
        },
        'Create': function() {
          console.log('Do create call');
        }
      }
    });
  })
};


Grid.prototype.getCreateFormHtml = function(event) {
};


Grid.prototype.mouseHeadingCell = function(event) {
  var $cell = $(this);
  var dataKey = 'order'
  var order = $cell.data(dataKey);
  var orderNew;

  if (!order) {
    orderNew = 'asc';
  } else if (order == 'asc') {
    orderNew = 'desc';
  } else {
    orderNew = '';
  };

  $cell
    .removeClass('is-order-asc')
    .removeClass('is-order-desc')
    .data(dataKey, orderNew);

  if (orderNew) {
    $cell.addClass('is-order-' + orderNew);
  };

  event.data.buildReadModel(event);
};


Grid.prototype.keySearchInput = function(event) {
  var $searchInput = $(this);
  clearTimeout(timeoutId);
  timeoutId = setTimeout(function() {
    if ($searchInput.val()) {
      event.data.buildReadModel(event);
    };
  }, 400);
};


// build a model which can be interpreted by the read method in php
// searches
// ordering
// pagination
Grid.prototype.buildReadModel = function(event) {
  var data = {
    search: [],
    order: [],
    rowLimit: 20,
    page: 1
  };

  // search
  var $searchInputs = event.data.$container.find(gS(event.data.searchInputClass));
  if ($searchInputs.length) {
    for (var index = $searchInputs.length - 1; index >= 0; index--) {
      var $searchInput = $($searchInputs[index]);
      var key = $searchInput.parent(gS(event.data.cellHeadingClass)).data('key');
      var value = $searchInput.val();
      if (value) {
        data.search.push({key: key, value: value});
      };
    };
  };

  // ordering
  var $headingCells = event.data.$container.find(gS(event.data.cellHeadingClass));
  for (var index = $headingCells.length - 1; index >= 0; index--) {
    $headingCell = $($headingCells[index]);
    if ($headingCell.data('order')) {
      var key = $headingCell.data('key');
      var value = $headingCell.data('order');
      data.order.push({key: key, value: value});
    };
  };

  event.data.read(event, data);
};


Grid.prototype.mouseDocument = function(event) {
  var $target = $(event.target);

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

  event.data.update(event, data);
};


// persist a rows
Grid.prototype.update = function(event, data) {
  $.ajax({
    type: 'get',
    url: event.data.options.url.update,
    dataType: 'html',
    data: data,
    success: function(response) {
      console.log('updated');
    },
    error: function(response) {
      console.log('not updated');
    }
  });
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
  event.data.options.onSelectCell.call(this, model, type);

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
    .focus();

  $cell.select();
};


module.exports = Grid;
