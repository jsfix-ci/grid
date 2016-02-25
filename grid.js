var $ = require('jquery');
var mustache = require('mustache');
var keyCode = {enter: 13, esc: 27};
var mustacheTemplates = require('./templates');
var dialogueFactory = require('mwyatt-dialogue');
var dialogueCreate = new dialogueFactory();
var timeoutId;
var feedbackQueueFactory = require('mwyatt-codex/feedbackQueue');
var feedbackQueue = new feedbackQueueFactory();


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
  this.tableClass = 'js-grid-table';
  this.rowClass = 'js-grid-row';
  this.rowHeadingClass = 'js-grid-row-heading';
  this.cellClass = 'js-grid-cell';
  this.inputClass = 'js-grid-cell-input';
  this.searchFieldClass = 'js-grid-search-field';
  this.searchInputClass = 'js-grid-search-input';
  this.searchSelectClass = 'js-grid-search-select';
  this.pageSelectClass = 'js-grid-pagination-select';
  this.perPageSelectClass = 'js-grid-cell-input-perpage';
  this.pageContainerClass = 'js-grid-pagination-container';
  this.buttonRemoveFiltersClass = 'js-grid-button-remove-filters';
  this.spinnerClass = 'js-grid-spinner';

  if (typeof localStorage === 'undefined') {
    console.warn('localStorage is not defined');
  };
  if (typeof JSON === 'undefined') {
    console.warn('JSON is not defined');
  };
};


Grid.prototype.create = function(options) {
  var defaults = {
    onSelectCell: function() {},
    onSelectRow: function() {},
  };
  this.options = $.extend(defaults, options);
  this.optionsOriginal = $.extend(true, {}, this.options); // true = deep copy
  this.appendSelectOptionsKeyValue({data: this});

  this.rowsPerPage = this.getRowsPerPage({data: this});

  var containerSelector = gS(getContainerSelector(this.options.id));
  this.$container = $(containerSelector);
  if (!this.$container.length) {
    console.warn('container not found in the dom', containerSelector);
  };

  // put grid container in dom
  this.$container.html(mustache.render(mustacheTemplates.grid, this.options));

  this.setEvents({data: this});
  this.storeInitialData();

  this.read({data: this}, this.getFirstReadModel({data: this}));
};


Grid.prototype.getRowsPerPage = function(event) {
  var storedModel = event.data.getStoredReadModel(event);
  if ('rowsPerPage' in storedModel) {
     return storedModel.rowsPerPage;
  };
  return event.data.options.perPageOptions[0];
};


Grid.prototype.getFirstReadModel = function(event) {
  var storedModel = event.data.getStoredReadModel(event);
  if (!$.isEmptyObject(storedModel)) {
    event.data.markContainerFiltering(event, storedModel);
    return storedModel;
  };
  return event.data.getReadModelDataDefaults(event);
};


// this structure is needed so that you can loop as an array
// factors in stored model to render selected items correctly
Grid.prototype.appendSelectOptionsKeyValue = function(event) {
  var storedModel = event.data.getStoredReadModel(event);

  for (var index = this.options.cols.length - 1; index >= 0; index--) {
    var model = this.options.cols[index];

    if ('selectOptions' in model) {
      model.selectOptionsKeyValue = [];
      for (var key in model.selectOptions) {
        var value = model.selectOptions[key];
        var selected = 'search' in storedModel && model.key in storedModel.search && storedModel.search[model.key] == value;
        model.selectOptionsKeyValue.push({
          selected: selected,
          key: key,
          value: value
        });
      };
    };

    if ('search' in model && model.search) {
      if ('search' in storedModel && model.key in storedModel.search) {
        model.searchDefaultValue = storedModel.search[model.key];
      };
    };
    this.options.cols[index] = model;
  };
};


Grid.prototype.read = function(event, data) {

  // clear out old rows
  event.data.$container
    .find(gS(event.data.rowClass))
    .remove();

  // spin time
  event.data.$container
    .find(gS(event.data.tableClass))
    .after(mustache.render(mustacheTemplates.spinner));

  // get new fun rows
  $.ajax({
    type: 'get',
    url: event.data.options.url.read,
    dataType: 'json',
    data: data,
    complete: function() {
      event.data.$container.find(gS(event.data.spinnerClass)).remove();
    },
    success: function(response) {
      if (
        typeof response === 'undefined'
        || typeof response.rowsTotal === 'undefined'
        || typeof response.rows === 'undefined'
      ) {
        return console.warn('read response malformed', response);
      };

      event.data.readRender(event, response.rows);
      event.data.renderPagination(event, response);
      event.data.storeReadModel(event, data);

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


Grid.prototype.renderPagination = function(event, response) {

  if (typeof Math === 'undefined') {
    return console.warn('Math object not defined');
  };

  var rowsTotal = parseInt(response.rowsTotal);
  var pageCurrent = parseInt(event.data.getPageCurrent(event));
  var rowsPerPage = event.data.rowsPerPage;
  var possiblePages;

  // lowest will be 1
  possiblePages = Math.ceil(rowsTotal / rowsPerPage);

  var options = [];
  for (var index = 1; index <= possiblePages; index++) {
    options.push({key: index, value: index, keySelected: pageCurrent == index});
  };

  // per page
  var optionsPerPage = [];
  for (var index = 0; index < event.data.options.perPageOptions.length; index++) {
    optionsPerPage.push({key: event.data.options.perPageOptions[index], value: event.data.options.perPageOptions[index], keySelected: rowsPerPage == event.data.options.perPageOptions[index]});
  };

  // render pagination
  event.data.$container.find(gS(event.data.pageContainerClass)).html(mustache.render(mustacheTemplates.pagination, {
      possiblePages: possiblePages,
      selectPages: {options: options, classNames: ['grid-pagination-select', event.data.pageSelectClass]},
      selectPerPage: {options: optionsPerPage, classNames: ['grid-pagination-select', event.data.perPageSelectClass]},
      rowsTotal: rowsTotal
    }, {select: mustacheTemplates.select}));
};


Grid.prototype.getPageCurrent = function(event) {
  return parseInt(event.data.$container.find(gS(event.data.pageSelectClass)).val());
};


Grid.prototype.readRender = function(event, rows) {

  // transform row values
  // select boxes appear are represented as the value
  // if the cell has a 'readTemplate' then it needs to be passed through that
  for (var indexRow = rows.length - 1; indexRow >= 0; indexRow--) {

    // step through each model and compare the row value with the same index and switch it out 
    for (var indexCell = 0; indexCell <= rows[indexRow].length - 1; indexCell++) {
      var value = rows[indexRow][indexCell];

      // change to new format html defaults to value
      rows[indexRow][indexCell] = {value: value, html: value};

      var model = event.data.getModelByIndex(event, indexCell);

      // select box value
      if ('selectOptions' in model) {
        if (value in model.selectOptions) {
          rows[indexRow][indexCell].html = model.selectOptions[value];
        };
      };

      // mst template
      if ('readTemplate' in model) {
        rows[indexRow][indexCell].html = mustache.render(model.readTemplate, [value]);
      };
    };
  };

  event.data.$container.find(gS(event.data.rowHeadingClass)).after(mustache.render(mustacheTemplates.rows, rows));
  
  event.data.$container.find(gS('js-grid-no-rows')).remove();
  if (!rows.length) {
      event.data.$container
        .find(gS(event.data.tableClass))
        .after(mustache.render('<div class="grid-no-rows js-grid-no-rows"><p>No Results, <span class="link-primary js-grid-button-remove-filters">Remove Filters</span>.</p></div>'));
  };
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
  event.data.$container.on('keyup.grid-' + event.data.options.id, gS(event.data.searchInputClass), event.data, function(event) {
    event.data.$container.find(gS(event.data.pageSelectClass)).val(1);
    event.data.keySearchInput(event);
  });

  // keyup on a edit input
  event.data.$container.on('keyup.grid-' + event.data.options.id, event.data, function(event) {

    // enter key and a cell is being edited
    if (keyCode.enter == event.which && event.data.$container.find(gS(event.data.cellClass) + gS(event.data.selectedClass))) {
      event.data.cellDeselect(event);
    } else if (keyCode.esc == event.which) {
      // event.data.cellDeselectNoSave(event);
    };
  });

  // search select
  event.data.$container.on('change.grid-' + event.data.options.id, gS(event.data.searchSelectClass), event.data, function(event) {
    event.data.$container.find(gS(event.data.pageSelectClass)).val(1);
    event.data.buildReadModel(event);
  });

  // search field clicking dont order heading
  event.data.$container.on('mousedown.grid-' + event.data.options.id, gS(event.data.searchFieldClass), event.data, function (event) {
    event.stopPropagation();
  });

  // order column
  event.data.$container.on('mousedown.grid-' + event.data.options.id, '.js-grid-cell-heading-orderable', event.data, event.data.mouseHeadingCell);

  // change page
  event.data.$container.on('change.grid-' + event.data.options.id, gS(event.data.pageSelectClass), event.data, event.data.buildReadModel);

  // change per page
  event.data.$container.on('change.grid-' + event.data.options.id, gS(event.data.perPageSelectClass), event.data, function() {
    event.data.$container.find(gS(event.data.pageSelectClass)).val(1);
    event.data.buildReadModel(event);
  });

  // remove all filtering
  // could make a render from scratch function?
  event.data.$container.on('click.grid-' + event.data.options.id, gS(event.data.buttonRemoveFiltersClass), event.data, function() {
    event.data.options = event.data.optionsOriginal;
    event.data.storeReadModel(event, event.data.getReadModelDataDefaults(event));
    event.data.appendSelectOptionsKeyValue(event);
    event.data.$container.html(mustache.render(mustacheTemplates.grid, event.data.options));
    event.data.buildReadModel(event);
  });

  event.data.$container.on('click.grid-' + event.data.options.id, gS('js-grid-button-create'), event.data, function(event) {

    dialogueCreate.create({
      mask: true,
      className: 'dialogue-grid-create',
      width: 300,
      title: 'Create',
      html: event.data.getCreateFormHtml(event),
      actions: {
        'Cancel': function() {
          this.close();
        },
        'Create': function() {
          event.data.createRow(event);
        }
      }
    });
  })
};


Grid.prototype.getCreateFormHtml = function(event) {
  var models = event.data.options.cols;
  var model;
  var data = [];
  for (var index = models.length - 1; index >= 0; index--) {
    model = models[index];

    model.inputType = event.data.getInputTypeFromModel(model);

    // remove primary key, at end because errors
    // must have a type otherwise cant have an input
    if (model.key != event.data.primaryKey && model.inputType) {
      data.push(model);
    };
  };

  return mustache.render(mustacheTemplates.formCreate, data.reverse());
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
    .removeClass('grid-heading-is-order-asc')
    .removeClass('grid-heading-is-order-desc')
    .data(dataKey, orderNew);

  if (orderNew) {
    $cell.addClass('grid-heading-is-order-' + orderNew);
  };

  event.data.buildReadModel(event);
};


Grid.prototype.keySearchInput = function(event) {
  var $searchInput = $(this);
  if (event.which == keyCode.enter) {
    event.data.buildReadModel(event);
  };
};


Grid.prototype.getReadModelDataDefaults = function(event) {
  return {
    search: {},
    order: {},
    rowsPerPage: event.data.rowsPerPage,
    pageCurrent: 1
  };
};


// build a model which can be interpreted by the read method in php
// searches
// ordering
// pagination
Grid.prototype.buildReadModel = function(event) {
  var data = event.data.getReadModelDataDefaults(event);

  // page
  $pageSelect = event.data.$container.find(gS(event.data.pageSelectClass));
  if ($pageSelect.length) {
    data.pageCurrent = $pageSelect.val();
  };

  // per page
  $perPageSelect = event.data.$container.find(gS(event.data.perPageSelectClass));
  if ($perPageSelect.length) {
    data.rowsPerPage = $perPageSelect.val();
    event.data.rowsPerPage = $perPageSelect.val(); // store in memory
  };

  // search
  var $searchInputs = event.data.$container.find(gS(event.data.searchFieldClass));
  if ($searchInputs.length) {
    for (var index = $searchInputs.length - 1; index >= 0; index--) {
      var $searchInput = $($searchInputs[index]);
      var key = $searchInput.closest(gS(event.data.cellHeadingClass)).data('key');
      var value = $searchInput.val();
      if (value !== ' ' && value) { // empty search value, better way?
        data.search[key] = value;
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
      data.order[key] = value;
    };
  };

  event.data.markContainerFiltering(event, data);
  event.data.read(event, data);
};


// flag container as being filtered
Grid.prototype.markContainerFiltering = function(event, readModel) {
  event.data.$container.removeClass('grid-is-filtering');
  if (('search' in readModel && !$.isEmptyObject(readModel.search)) || ('order' in readModel && !$.isEmptyObject(readModel.order))) {
    event.data.$container.addClass('grid-is-filtering');
  };
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

  var primaryKeyValue = event.data.getSelectedRowPrimaryValue(event);

  event.data.rowDeselect(event);

  var $selectedCell = $selectedRow.find(gS(event.data.cellClass) + gS(event.data.selectedClass));

  $selectedCell.removeClass(event.data.selectedClass);

  if (!$selectedCell.length) {
    return;
  };

  var model = event.data.getModelByIndex(event, $selectedCell.index());

  // not editable
  if (!('update' in event.data.options.url) || ('edit' in model && !model.edit)) {
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
  data['name'] = model.key;
  data['value'] = newValue;

  event.data.update(event, data);
};


// persist a rows
Grid.prototype.update = function(event, data) {
  $.ajax({
    type: 'get',
    url: event.data.options.url.update,
    dataType: 'json',
    data: data,
    success: function(response) {
      if ('rowCount' in response && response.rowCount == 1) {
        feedbackQueue.createMessage({message: 'Updated row \'' + data.name + '\' with value \'' + data.value + '\'.', type: 'success'});
      };
    },
    error: function(response) {
      feedbackQueue.createMessage({message: 'There was a problem while updating the row.'});
    }
  });
};


Grid.prototype.createRow = function(event) {
  var data = {columns: {}};
  var $formCreateCells = $('.js-form-create-cell');
  for (var index = $formCreateCells.length - 1; index >= 0; index--) {
    var $formCreateCell = $($formCreateCells[index]);
    data.columns[$formCreateCell.prop('name')] = $formCreateCell.val();
  };

  $.ajax({
    type: 'get',
    url: event.data.options.url.create,
    dataType: 'json',
    data: data,
    success: function(response) {
      if ('rowCount' in response && response.rowCount == 1) {
        feedbackQueue.createMessage({message: 'Created row \'' + data.name + '\' with value \'' + data.value + '\'.', type: 'success'});
        dialogueCreate.close();
      } else {
        feedbackQueue.createMessage({message: 'Row was not created.'});
      };
    },
    error: function(response) {
      feedbackQueue.createMessage({message: 'There was a problem while creating the row.'});
    }
  });
};


// returns the selected row primary value
Grid.prototype.getSelectedRowPrimaryValue = function(event) {
  var $selectedRow = event.data.$container.find(gS(event.data.rowClass) + gS(event.data.selectedClass));
  var $selectedCell = $selectedRow.find(gS(event.data.cellClass) + gS(event.data.selectedClass));
  var $primaryHeadingCell = event.data.$container.find(gS(event.data.cellHeadingClass) + '[data-key="' + event.data.primaryKey + '"]');
  var $primaryCell = $selectedRow.find(gS(event.data.cellClass)).eq($primaryHeadingCell.index());
  return $primaryCell.data('value');
};


// using model get the input type
Grid.prototype.getInputTypeFromModel = function(model) {
  if ('selectOptions' in model) {
    return 'select';
  } else if ('type' in model) {
    return model.type;
  } else {
    return '';
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
  if (!('update' in event.data.options.url) || ('edit' in model && !model.edit)) {
    return;
  };

  // replace html for input using data value
  if (type == 'select') {
    template = mustacheTemplates.select;
    data.options = model.selectOptionsKeyValue;
    data.classNames = ['grid-cell-input', event.data.inputClass];
    for (var index = data.options.length - 1; index >= 0; index--) {
      data.options[index].keySelected = $cell.data('value') == data.options[index].key;
    };
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


Grid.prototype.getStorageKey = function(event) {
  return 'mwyatt-grid-' + event.data.options.id;
}


// return the last performed read model
// defaults to empty object
Grid.prototype.getStoredReadModel = function(event) {
  var readModel = JSON.parse(localStorage.getItem(event.data.getStorageKey(event)));
  return readModel ? readModel : {};
}


Grid.prototype.storeReadModel = function(event, model) {
  localStorage.setItem(event.data.getStorageKey(event), JSON.stringify(model));
}


module.exports = Grid;
