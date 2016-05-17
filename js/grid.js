var $ = require('jquery');
var tinymce = require('tinymce');
var mustache = require('mustache');
var utils = require('./utilities');
var mustacheTemplates = require('./templates');
var dialogueFactory = require('mwyatt-dialogue');
var feedbackQueueFactory = require('mwyatt-feedback-queue');
var classes = require('./classes');
var tinymceConfig = {
  selector: '.js-grid-dialogue-wysi-textarea',
  height: 400,
  plugins: [
    'advlist autolink lists link image charmap print preview anchor',
    'searchreplace visualblocks code fullscreen',
    'insertdatetime media table contextmenu paste code'
  ],
  toolbar: 'insertfile undo redo | styleselect | bold italic | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image',
  content_css: [
    '//fast.fonts.net/cssapi/e6dc9b99-64fe-4292-ad98-6974f93cd2a2.css',
    '//www.tinymce.com/css/codepen.min.css'
  ],
  setup: function(editor) {
    editor.on('init', function() {
      dialogueCellWysi.applyCss({data: dialogueCellWysi});
    });
  }
};

var keyCode = {enter: 13, esc: 27};
var timeoutId;
var dialogueCreate = new dialogueFactory();
var dialogueCellWysi = new dialogueFactory();
var dialogue = new dialogueFactory();
var feedbackQueue = new feedbackQueueFactory();

var Grid = function() {
  this.rowsCurrent = []; // collection of rows read in currently

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

  var containerSelector = utils.gS(utils.getContainerSelector(this.options.id));
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
        var storedModelValue;
        var selected;

        if (typeof storedModel != 'undefined') {
          if (typeof storedModel.search != 'undefined') {
            storedModelValue = model.selectOptions[storedModel.search[model.key]];
          }

          selected = 'search' in storedModel && model.key in storedModel.search && storedModelValue == value;
        }

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

  // clear out no results pane
  event.data.$container.find(utils.gS(classes.noResults)).remove();

  // fade out old rows
  event.data.$container.addClass(classes.reading);

  // spin time
  event.data.$container
    .find(utils.gS(classes.tableContainer))
    .append(mustache.render(mustacheTemplates.spinner));

  // get new fun rows
  $.ajax({
    type: 'get',
    url: event.data.options.url.read,
    dataType: 'json',
    data: data,
    complete: function() {
      event.data.$container.removeClass(classes.reading);
      event.data.$container.find(utils.gS(classes.spinner)).remove();
      event.data.$container.hide().show(0);
    },
    success: function(response) {
      if (
        typeof response === 'undefined' ||
        typeof response.rowsTotal === 'undefined' ||
        typeof response.rows === 'undefined'
      ) {
        return console.warn('read response malformed', response);
      };

      event.data.readRender(event, response.rows);
      event.data.renderPagination(event, response);
      event.data.storeReadModel(event, data);
      event.data.rowsCurrent = response.rows;
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
  possiblePages = possiblePages < 1 ? 1 : possiblePages;

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
  event.data.$container.find(utils.gS(classes.pageContainer)).html(mustache.render(mustacheTemplates.pagination, {
      possiblePages: possiblePages,
      selectPages: {options: options, classNames: ['grid-pagination-select', classes.pageSelect]},
      selectPerPage: {options: optionsPerPage, classNames: ['grid-pagination-select', classes.perPageSelect]},
      rowsTotal: rowsTotal
    }, {select: mustacheTemplates.select}));
};

Grid.prototype.getPageCurrent = function(event) {
  var pageCurrent = parseInt(event.data.$container.find(utils.gS(classes.pageSelect)).val());
  return pageCurrent > 0 ? pageCurrent : 1;
};

Grid.prototype.readRender = function(event, rows) {

  // remove any existing rows
  event.data.$container.find(utils.gS(classes.row)).remove();

  // find out if any html models exist
  // replace the data with a blank space, or class

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

      if ('type' in model && model.type == 'html') {
        rows[indexRow][indexCell].html = 'html';
      }

      // mst template
      if ('readTemplate' in model) {
        rows[indexRow][indexCell].html = mustache.render(model.readTemplate, [value]);
      };
    };
  };

  event.data.$container.find(utils.gS(classes.rowHeading)).after(mustache.render(mustacheTemplates.rows, rows));

  if (rows.length) {

    // attach delete button
    if ('delete' in event.data.options.url) {
      var $rows = event.data.$container.find(utils.gS(classes.row));
      for (var index = $rows.length - 1; index >= 0; index--) {
        var $row = $($rows[index]);
        $row.find(utils.gS(classes.cell)).last().append(mustache.render(mustacheTemplates.deleteButton));
      };
    };
  } else {
    event.data.$container
      .find(utils.gS(classes.table))
      .after(mustache.render(mustache.render(mustacheTemplates.noRowsPane)));
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

Grid.prototype.deleteRow = function(event) {
  var data = {};
  var $trigger = $(this);
  event.data.selectRowByCell(event, $trigger.closest(utils.gS(classes.cell)));
  data[event.data.primaryKey] = event.data.getSelectedRowPrimaryValue(event);

  dialogue.create({
    positionTo: $trigger,
    className: 'dialogue-grid-delete',
    width: 200,
    title: 'Delete Row',
    description: 'Are you sure you want to delete this row?',
    actions: {
      'Cancel': function() {
        this.close();
      },
      'Delete': function() {
        $.ajax({
          type: 'get',
          url: event.data.options.url.delete,
          dataType: 'json',
          data: data,
          success: function(response) {
            if ('rowCount' in response && response.rowCount == 1) {
              feedbackQueue.createMessage({message: 'Deleted row \'' + data[event.data.primaryKey] + '\'.', type: 'success'});
            } else {
              feedbackQueue.createMessage({message: 'Row \'' + data[event.data.primaryKey] + '\' already deleted.'});
            };
            dialogue.close();
            event.data.buildReadModel(event);
          },
          error: function(response) {
            feedbackQueue.createMessage({message: 'There was a problem while deleting the row.'});
          }
        });
      }
    }
  });
};

Grid.prototype.setEvents = function(event) {

  // clicking the cell
  event.data.$container.on(utils.gEvtNs('mouseup'), event.data, event.data.mouseDocument);

  event.data.$container.on(utils.gEvtNs('click'), utils.gS(classes.buttonDelete), event.data, event.data.deleteRow);

  // search input
  event.data.$container.on(utils.gEvtNs('keyup'), utils.gS(classes.searchInput), event.data, function(event) {
    event.data.$container.find(utils.gS(classes.pageSelect)).val(1);
    event.data.keySearchInput(event);
  });

  // keyup on a edit input
  event.data.$container.on(utils.gEvtNs('keyup'), event.data, function(event) {

    // enter key and a cell is being edited
    if (keyCode.enter == event.which && event.data.getSelectedCell(event)) {
      event.data.cellDeselect(event, {persist: true});
    } else if (keyCode.esc == event.which) {
      event.data.cellDeselect(event, {revert: true});
    };
  });

  // search select
  event.data.$container.on(utils.gEvtNs('change'), utils.gS(classes.searchSelect), event.data, function(event) {
    event.data.$container.find(utils.gS(classes.pageSelect)).val(1);
    event.data.buildReadModel(event);
  });

  // search field clicking dont order heading
  event.data.$container.on(utils.gEvtNs('mouseup'), utils.gS(classes.searchField), event.data, function(event) {
    event.stopPropagation();
  });

  // order column
  event.data.$container.on(utils.gEvtNs('mouseup'), utils.gS(classes.gridCellHeadingOrderable), event.data, event.data.mouseHeadingCell);

  // change page
  event.data.$container.on(utils.gEvtNs('change'), utils.gS(classes.pageSelect), event.data, event.data.buildReadModel);

  // change per page
  event.data.$container.on(utils.gEvtNs('change'), utils.gS(classes.perPageSelect), event.data, function() {
    event.data.$container.find(utils.gS(classes.pageSelect)).val(1);
    event.data.buildReadModel(event);
  });

  // remove all filtering
  // could make a render from scratch function?
  event.data.$container.on(utils.gEvtNs('click'), utils.gS(classes.buttonRemoveFilters), event.data, function() {
    event.data.options = event.data.optionsOriginal;
    event.data.storeReadModel(event, event.data.getReadModelDataDefaults(event));
    event.data.appendSelectOptionsKeyValue(event);
    event.data.$container.html(mustache.render(mustacheTemplates.grid, event.data.options));
    event.data.buildReadModel(event);
  });

  event.data.$container.on(utils.gEvtNs('click'), utils.gS(classes.buttonCreate), event.data, function(event) {

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
  });
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
  var dataKey = 'order';
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
  $pageSelect = event.data.$container.find(utils.gS(classes.pageSelect));
  if ($pageSelect.length) {
    data.pageCurrent = $pageSelect.val();
  };

  // per page
  $perPageSelect = event.data.$container.find(utils.gS(classes.perPageSelect));
  if ($perPageSelect.length) {
    data.rowsPerPage = $perPageSelect.val();
    event.data.rowsPerPage = $perPageSelect.val(); // store in memory
  };

  // search
  var $searchInputs = event.data.$container.find(utils.gS(classes.searchField));
  if ($searchInputs.length) {
    for (var index = $searchInputs.length - 1; index >= 0; index--) {
      var $searchInput = $($searchInputs[index]);
      var key = $searchInput.closest(utils.gS(classes.cellHeading)).data('key');
      var value = $searchInput.val();
      if (value !== ' ' && value) { // empty search value, better way?
        data.search[key] = value;
      };
    };
  };

  // ordering
  var $headingCells = event.data.$container.find(utils.gS(classes.cellHeading));
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
    return event.data.cellDeselect(event);
  };

  // is cell and selected
  if ($target.hasClass(classes.cell) && $target.hasClass(classes.selected)) {
    return;
  };

  // is cell and not selected
  // deselect then select
  if ($target.hasClass(classes.cell)) {
    event.data.cellDeselect(event, {persist: true});
    event.data.cellSelect(event, $target);
  };
};

Grid.prototype.getModelByIndex = function(event, index) {
  var thKey = event.data.$container.find(utils.gS(classes.cellHeading)).eq(index).data('key');
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

// deselect row by removing classes
Grid.prototype.rowDeselect = function(event) {
  var $selectedRow = event.data.getSelectedRow(event);

  if (!$selectedRow.length) {
    return;
  };

  $selectedRow.removeClass(classes.selected);
};

Grid.prototype.getSelectedRow = function(event) {
  return event.data.$container.find(utils.gS(classes.row) + utils.gS(classes.selected));
};

Grid.prototype.getSelectedCell = function(event) {
  return event.data.$container.find(utils.gS(classes.cell) + utils.gS(classes.selected));
};

// deselect cell with options relating to persistence
Grid.prototype.cellDeselect = function(event, options) {
  var $selectedRow = event.data.getSelectedRow(event);
  var wasChanged;
  var defaults = {
    persist: false,
    revert: false
  };
  options = $.extend(defaults, typeof options === 'undefined' ? {} : options);

  if (!$selectedRow.length) {
    return;
  };

  var primaryKeyValue = event.data.getSelectedRowPrimaryValue(event);
  var $selectedCell = event.data.getSelectedCell(event);

  if (!$selectedCell.length) {
    return;
  };

  var newValue = event.data.getSelectedCellInputValue(event);
  var model = event.data.getModelByIndex(event, $selectedCell.index());

  // deselect visibly
  event.data.rowDeselect(event);
  $selectedCell.removeClass(classes.selected);

  // not editable
  if (!('update' in event.data.options.url) || ('edit' in model && !model.edit)) {
    return;
  };

  var $selectedCellInput = $selectedCell.find(utils.gS(classes.input));
  var cellHtml;
  var persistedValue = event.data.getRowCellValue(event, $selectedCell);

  if (newValue == persistedValue) {
    wasChanged = false;
  } else {
    wasChanged = true;
  };

  // get selected option html
  var type = event.data.getInputTypeFromModel(model);

  // select needs to get the display name from the key
  if (type == 'select') {
    for (var key in model.selectOptions) {
      if (key == newValue) {
        cellHtml = model.selectOptions[key];
      };
    };

  // store the new value in data
  // put in html the display name of it
  } else if (options.revert) {
    cellHtml = persistedValue;
  } else {
    cellHtml = newValue;
  };

  if (model.type != 'html') {
    $selectedCell.html(cellHtml);
  }

  if (options.persist && wasChanged) {

    // perform persist update
    data = {};
    data[event.data.primaryKey] = primaryKeyValue;
    data['name'] = model.key;
    data['value'] = newValue;

    event.data.update(event, data);
  };
};

Grid.prototype.getSelectedCellInputValue = function(event) {
  var $selectedCellInput = event.data.getSelectedCell(event).find(utils.gS(classes.input));

  if ($selectedCellInput.length) {
    return $selectedCellInput.val();
  } else if (typeof tinymce.activeEditor !== 'undefined' && tinymce.activeEditor) { // html
    return tinymce.activeEditor.getContent();
  }
};

// persist a row cell
Grid.prototype.update = function(event, data) {
  $.ajax({
    type: 'get',
    url: event.data.options.url.update,
    dataType: 'json',
    data: data,
    success: function(response) {
      if ('rowCount' in response && response.rowCount == 1) {
        feedbackQueue.createMessage({message: 'Updated row \'' + data.name + '\' with value \'' + data.value + '\'.', type: 'success'});
        event.data.buildReadModel(event);
        dialogueCellWysi.close();
      };
    },
    error: function(response) {
      feedbackQueue.createMessage({message: 'There was a problem while updating the row.'});
    }
  });
};

Grid.prototype.createRow = function(event) {
  var data = {columns: {}};
  var $formCreateCells = $(utils.gS(classes.formCreateCell));
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
        feedbackQueue.createMessage({message: 'Created row.', type: 'success'});
        dialogueCreate.close();
        event.data.buildReadModel(event);
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
  var $selectedRow = event.data.getSelectedRow(event);
  var $selectedCell = event.data.getSelectedCell(event);
  var $primaryHeadingCell = event.data.$container.find(utils.gS(classes.cellHeading) + '[data-key="' + event.data.primaryKey + '"]');
  var $primaryCell = $selectedRow.find(utils.gS(classes.cell)).eq($primaryHeadingCell.index());

  return event.data.getRowCellValue(event, $primaryCell);
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
    .find(utils.gS(classes.row))
    .removeClass(classes.selected);

  // select row closest to cell
  $cell
    .closest(utils.gS(classes.row))
    .addClass(classes.selected);
};

// switch the data out with an input / select
Grid.prototype.cellSelect = function(event, $cell) {
  var template;
  var data = [];
  var model = event.data.getModelByIndex(event, $cell.index());
  var type = event.data.getInputTypeFromModel(model);
  var persistedValue = event.data.getRowCellValue(event, $cell);
  
  event.data.selectRowByCell(event, $cell);
  
  var passBack = {
    primaryKeyValue: event.data.getSelectedRowPrimaryValue(event),
    cellValue: persistedValue,
    cellType: type,
    model: model
  };

  event.data.options.onSelectCell.call(passBack);
  event.data.options.onSelectRow.call(passBack);

  // not editable
  if (!('update' in event.data.options.url) || ('edit' in model && !model.edit)) {
    return;
  };

  $cell.addClass(classes.selected);

  // replace html for input using data value
  if (type == 'html') {
    dialogueCellWysi.create({
      mask: true,
      hardClose: true,
      width: 500,
      html: mustache.render('<textarea class="js-grid-dialogue-wysi-textarea">{{html}}</textarea>', {html: persistedValue}),
      onClose: function() {
        event.data.cellDeselect(event, {revert: true});
        if (typeof tinymce.activeEditor !== 'undefined') {
          tinymce.activeEditor.remove();
        }
      },
      onComplete: function() {
        tinymce.init(tinymceConfig);
      },
      actions: {
        Save: function() {
          event.data.cellDeselect(event, {persist: true});
          dialogueCellWysi.close();
        }
      }
    });
  } else if (type == 'select') {
    template = mustacheTemplates.select;
    data.options = model.selectOptionsKeyValue;
    data.classNames = ['grid-cell-input', classes.input];
    for (var index = data.options.length - 1; index >= 0; index--) {
      data.options[index].keySelected = persistedValue == data.options[index].key;
    };
  } else {
    template = mustacheTemplates.input;
    data = {type: 'text', value: persistedValue};
  };

  if (type != 'html') {
    $cell.html(mustache.render(template, data));
    $cell.find(utils.gS(classes.input)).val(persistedValue).focus().select();
  }
};

Grid.prototype.getRowCellValue = function(event, $cell) {
  var rowPos = $cell.parent(utils.gS(classes.row)).index();
  var cellPos = $cell.index();
  return event.data.rowsCurrent[rowPos - 1][cellPos]['value'];
};

Grid.prototype.getStorageKey = function(event) {
  return 'mwyatt-grid-' + event.data.options.id;
};

// return the last performed read model
// defaults to empty object
Grid.prototype.getStoredReadModel = function(event) {
  var readModel = JSON.parse(localStorage.getItem(event.data.getStorageKey(event)));
  return readModel ? readModel : {};
};

Grid.prototype.storeReadModel = function(event, model) {
  localStorage.setItem(event.data.getStorageKey(event), JSON.stringify(model));
};

module.exports = Grid;
