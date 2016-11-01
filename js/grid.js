var $ = require('jquery')
var tinymce = require('tinymce')
var mustache = require('mustache')
var dialogueFactory = require('mwyatt-dialogue')
var feedbackQueueFactory = require('mwyatt-feedback-queue')
var classes = require('./classes')

var templateNoRowsPane = require('./noRowsPane.mustache')
var templateDeleteButton = require('./deleteButton.mustache')
var templateInput = require('./input.mustache')
var templateSelect = require('./select.mustache')
var templateSpinner = require('./spinner.mustache')
var templateRows = require('./rows.mustache')
var templateFormCreate = require('./formCreate.mustache')
var templateGrid = require('./grid.mustache')
var templatePagination = require('./pagination.mustache')

var keyCode = {enter: 13, esc: 27}
var timeoutId
var dialogueCreate = new dialogueFactory()
var dialogueCellWysi = new dialogueFactory()
var dialogue = new dialogueFactory()
var feedbackQueue = new feedbackQueueFactory()
var tinymceConfig = {
  selector: '.js-grid-dialogue-wysi-textarea',
  height: 400,
  relative_urls: true,
  convert_urls: false,
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
      dialogueCellWysi.reposition()
    })
  }
}

var Grid = function() {
  this.rowsCurrent = []
  checkBrowserSupport()
}

Grid.prototype.create = function(options) {
  var optionsDefaults = getOptionsDefaults()
  var optionsDefaultsPristine = getOptionsDefaults()
  this.options = $.extend(true, optionsDefaults, options)
  this.optionsPristine = $.extend(true, optionsDefaultsPristine, options)
  this.rowsPerPage = getRowsPerPage(this)
  optionsValidate(this.options)
  addPrimaryKeyToGrid(this)
  setupContainer(this)
  setEvents(this)
  setupRenderAreaAndRead(this)
}

function setupContainer(grid) {
  var containerSelector = gS(getContainerSelector(grid.options.id))
  grid.$container = $(containerSelector)
  if (!grid.$container.length) {
    console.warn('container not found in the dom', containerSelector)
  }
}

function setupRenderAreaAndRead(grid) {
  modifyOptionsBeforeRender(grid)
  renderGridAndRead(grid)
}

function renderGridAndRead(grid) {
  grid.$container.html(mustache.render(templateGrid, grid.options))
  read(grid)
}

function optionsValidate(options) {
  if (!options.id.length) {
    console.warn('missing', 'options.id')
  }
  if (!options.url.read.length) {
    console.warn('missing', 'options.url.read')
  }
  if (!options.cols.length) {
    console.warn('missing', 'options.cols')
  }
}

function getRowsPerPage(grid) {
  var storedModel = getReadModel(grid)
  return storedModel.rowsPerPage
}

// obtains css selector version of a class name
function gS(className) {
  return '.' + className;
}

// obtain event namespaced
function gEvtNs(eventName) {
  return eventName + '.grid';
}

function getContainerSelector(id) {
  return 'js-grid-' + id + '-container';
}

function getReadModel(grid) {
  var storedModel = getStoredReadModel(grid)
  if (!$.isEmptyObject(storedModel)) {
    return storedModel
  }
  return getReadModelDataDefaults(grid)
}

// creates within col: selectOptionsKeyValue and searchDefaultValue
function modifyOptionsBeforeRender(grid) {
  var readModel = getReadModel(grid)
  grid.options.cols.forEach(function(col, index) {
    if ('selectOptions' in col && !('selectOptionsKeyValue' in col)) {
      col.selectOptionsKeyValue = []
      for (var key in col.selectOptions) {
        var value = col.selectOptions[key]
        var storedModelValue = col.selectOptions[readModel.search[col.key]]
        var selected = col.key in readModel.search && storedModelValue == value
        col.selectOptionsKeyValue.push({
          selected: selected,
          key: key,
          value: value
        })
      }
    }
    if ('search' in col && col.search) {
      if (col.key in readModel.search) {
        col.searchDefaultValue = readModel.search[col.key]
      }
    }
    if ('order' in col && col.order) {
      if (col.key in readModel.order) {
        col.orderDefaultValue = readModel.order[col.key]
      }
    }
    if ('visibility' in readModel && col.key in readModel.visibility) {
      col.isVisible = readModel.visibility[col.key]
    } else {
      col.isVisible = true
    }
    grid.options.cols[index] = col
  })
}

function read(grid) {
  var data = getAjaxReadData(grid)

  // clear out no results pane
  grid.$container.find(gS(classes.noResults)).remove()

  // fade out old rows
  grid.$container.addClass(classes.reading)

  // spin time
  grid.$container.find(gS(classes.tableContainer)).append(mustache.render(templateSpinner))

  $.ajax({
    type: 'get',
    url: grid.options.url.read,
    dataType: 'json',
    data: data,
    complete: function() {
      grid.$container.removeClass(classes.reading)
      grid.$container.find(gS(classes.spinner)).remove()
      grid.$container.hide().show(0)
      markContainerFiltering(grid)
    },
    success: function(response) {
      if (
        typeof response === 'undefined' ||
        typeof response.rowsTotal === 'undefined' ||
        typeof response.rows === 'undefined'
      ) {
        return console.warn('read response malformed', response)
      }
      readRender(grid, response.rows)
      storeReadModel(grid, data)
      renderPagination(grid, response)
      grid.rowsCurrent = response.rows
    },
    error: function(response) {
      return console.warn('problem with read request')
    }
  })
}

function renderPagination(grid, response) {
  var readModel = getReadModel(grid)
  var rowsTotal = parseInt(response.rowsTotal)
  var pageCurrent = readModel.pageCurrent
  var rowsPerPage = readModel.rowsPerPage
  var possiblePages

  // lowest will be 1
  possiblePages = Math.ceil(rowsTotal / rowsPerPage)
  possiblePages = possiblePages < 1 ? 1 : possiblePages

  grid.possiblePages = possiblePages

  var options = []
  for (var index = 1; index <= possiblePages; index++) {
    options.push({key: index, value: index, keySelected: pageCurrent == index})
  }

  // per page
  var optionsPerPage = []
  for (var index = 0; index < grid.options.perPageOptions.length; index++) {
    optionsPerPage.push({key: grid.options.perPageOptions[index], value: grid.options.perPageOptions[index], keySelected: rowsPerPage == grid.options.perPageOptions[index]})
  }

  // render pagination
  grid.$container.find(gS(classes.pageContainer)).html(mustache.render(templatePagination, {
      url: grid.options.url,
      cols: grid.options.cols,
      possiblePages: possiblePages,
      showPageControls: possiblePages > 1,
      selectPages: {options: options, classNames: ['form-select', 'grid-pagination-select', classes.pageSelect]},
      selectPerPage: {options: optionsPerPage, classNames: ['form-select', 'grid-pagination-select', classes.perPageSelect]},
      rowsTotal: rowsTotal
    }, {select: templateSelect}))
}

// takes all rows from read response and creates nice object
// which may changed the display values before rendering
function getReadRowsAsObject(grid, rows) {
  var rowsObject = []
  rows.forEach(function(row, indexRow) {
    var rowObject = []
    row.forEach(function(cellValue, indexCell) {
      var cellObject = {
        value: cellValue,
        html: cellValue
      }
      var model = getModelByIndex(grid, indexCell)
      cellObject.isVisible = model.isVisible
      cellObject.isEditable = model.edit
      if (model) {
        if ('selectOptions' in model) {
          if (cellValue in model.selectOptions) {
            cellObject.html = model.selectOptions[cellValue]
          }
        }
        if ('type' in model && model.type == 'html') {
          cellObject.html = 'html'
        }
        if ('readTemplate' in model) {
          cellObject.html = mustache.render(model.readTemplate, [cellValue])
        }
      }
      rowObject.push(cellObject)
    })
    rowsObject.push(rowObject)
  })
  return rowsObject;
}

function readRender(grid, rows) {
  var rowsObject = getReadRowsAsObject(grid, rows)
  grid.$container.find(gS(classes.row)).remove()
  grid.$container.find(gS(classes.rowHeading)).after(mustache.render(templateRows, rowsObject))
  if (rows.length) {
    if (grid.options.url.delete) {
      var $rows = grid.$container.find(gS(classes.row))
      for (var i = $rows.length - 1; i >= 0; i--) {
        var $row = $($rows[i])
        $row.find(gS(classes.cell)).last().append(mustache.render(templateDeleteButton))
      }
    }
  } else {
    grid.$container.find(gS(classes.table)).after(mustache.render(mustache.render(templateNoRowsPane)))
  }
}

// extract primary key and store
function addPrimaryKeyToGrid(grid) {
  for (var index = grid.options.cols.length - 1; index >= 0; index--) {
    if ('primaryKey' in grid.options.cols[index]) {
      grid.primaryKey = grid.options.cols[index].key
    }
  }
}

function deleteRow(grid, $target) {
  var data = {}
  selectRowByCell(grid, $target.closest(gS(classes.cell)))
  data[grid.primaryKey] = getSelectedRowPrimaryValue(grid)
  dialogue.create({
    positionTo: $target[0],
    className: 'dialogue-grid-delete',
    width: 200,
    title: 'Delete Row',
    description: 'Are you sure you want to delete this row?',
    actions: {
      'Cancel': function() {
        this.close()
      },
      'Delete': function() {
        $.ajax({
          type: 'get',
          url: grid.options.url.delete,
          dataType: 'json',
          data: data,
          success: function(response) {
            if ('rowCount' in response && response.rowCount == 1) {
              feedbackQueue.createMessage({message: 'Deleted row \'' + data[grid.primaryKey] + '\'.', type: 'success'})
            } else {
              feedbackQueue.createMessage({message: 'Row \'' + data[grid.primaryKey] + '\' already deleted.'})
            }
            dialogue.close()
            read(grid)
          },
          error: function(response) {
            feedbackQueue.createMessage({message: 'There was a problem while deleting the row.'})
          }
        })
      }
    }
  })
}

function customColClick(grid, $buttonCol) {
  var readModel = getReadModel(grid)
  var modelKey = $buttonCol.data('key')
  var invisibleCols = 0

  if (modelKey in readModel.visibility) {
    readModel.visibility[modelKey] = readModel.visibility[modelKey] ? false : true
  } else {
    readModel.visibility[modelKey] = false
  }

  for (key in readModel.visibility) {
    if (!readModel.visibility[key]) {
      invisibleCols++
    }
  }

  if (invisibleCols >= grid.options.cols.length) {
    return dialogue.create({
      width: 200,
      mask: true,
      title: 'Column Visibility',
      description: 'Only one visible column remains. Please make another visible before hiding this one.',
      actions: {
        Ok: function() {
          dialogue.close()
        }
      }
    })
  }

  storeReadModel(grid, readModel)
  setupRenderAreaAndRead(grid)
}

function setEvents(grid) {

  grid.$container.on(gEvtNs('mouseup'), function(event) {
    onMouseUpCell(grid, $(event.target))
  })

  grid.$container.on(gEvtNs('click'), gS(classes.buttonDelete), function() {
    deleteRow(grid, $(this))
  })

  grid.$container.on(gEvtNs('click'), gS(classes.customColsCol), function() {
    customColClick(grid, $(this))
  })

  grid.$container.on(gEvtNs('keyup'), gS(classes.searchInput), function(event) {
    grid.$container.find(gS(classes.pageSelect)).val(1)
    if (event.which == keyCode.enter) {
      searchInputCommitChange(grid, $(this))
    }
  })

  grid.$container.on(gEvtNs('keyup'), function(event) {
    if (keyCode.enter == event.which && getSelectedCell(grid)) {
      cellDeselect(grid, {persist: true})
    } else if (keyCode.esc == event.which) {
      cellDeselect(grid, {revert: true})
    }
  })

  // search select
  grid.$container.on(gEvtNs('change'), gS(classes.searchSelect), function() {
    grid.$container.find(gS(classes.pageSelect)).val(1)
    searchInputCommitChange(grid, $(this))
  })

  // search field clicking dont order heading
  grid.$container.on(gEvtNs('mouseup'), gS(classes.searchField), function(event) {
    event.stopPropagation()
  })

  // order column
  grid.$container.on(gEvtNs('mouseup'), gS(classes.gridCellHeadingOrderable), function() {
    mouseHeadingCell(grid, $(this))
  })

  grid.$container.on(gEvtNs('mouseup'), gS('js-grid-pagecontrol'), function() {
    var $pageSelect = grid.$container.find(gS(classes.pageSelect))
    var pageCurrent = parseInt($pageSelect.val())
    var newPage
    if ($(this).data('direction') == 'next') {
      newPage = pageCurrent + 1
    } else {
      newPage = pageCurrent - 1
    }
    if (newPage <= grid.possiblePages && newPage > 0) {
      $pageSelect.val(newPage)
      $pageSelect.trigger('change')
    }
  })

  // change page
  grid.$container.on(gEvtNs('change'), gS(classes.pageSelect), function() {
    read(grid)
  })

  // change per page
  grid.$container.on(gEvtNs('change'), gS(classes.perPageSelect), function() {
    grid.$container.find(gS(classes.pageSelect)).val(1)
    read(grid)
  })

  // remove all filtering
  // could make a render from scratch function?
  grid.$container.on(gEvtNs('click'), gS(classes.buttonRemoveFilters), function() {
    resetAll(grid)
  })

  grid.$container.on(gEvtNs('click'), gS(classes.buttonCreate), function(event) {
    openCreateRow(grid)
  })
}

function searchInputCommitChange(grid, $searchInput) {
  var $heading = $searchInput.closest(gS(classes.cellHeading))
  var key = $heading.data('key')
  var readModel = getReadModel(grid)
  var newVal = $searchInput.val()
  readModel.search[key] = newVal
  storeReadModel(grid, readModel)
  read(grid)
}

function openCreateRow(grid) {
  dialogueCreate.create({
    mask: true,
    className: 'dialogue-grid-create',
    width: 300,
    title: 'Create',
    html: getCreateFormHtml(grid),
    actions: {
      'Cancel': function() {
        this.close()
      },
      'Create': function() {
        createRow(grid)
      }
    }
  })
}

function resetAll(grid) {
  grid.options = grid.optionsPristine
  storeReadModel(grid, getReadModelDataDefaults(grid))
  setupRenderAreaAndRead(grid)
}

function getCreateFormHtml(grid) {
  var models = grid.options.cols
  var model
  var data = []
  for (var index = models.length - 1; index >= 0; index--) {
    model = models[index]
    model.inputType = getInputTypeFromModel(model)

    // remove primary key, at end because errors
    // must have a type otherwise cant have an input
    if (model.key != grid.primaryKey && model.inputType) {
      data.push(model)
    }
  }
  return mustache.render(templateFormCreate, data.reverse())
}

function mouseHeadingCell(grid, $target) {
  var dataKey = 'order'
  var order = $target.data(dataKey)
  var colKey = $target.data('key')
  var readModel = getReadModel(grid)
  var orderNew

  if (!order) {
    orderNew = 'asc'
  } else if (order == 'asc') {
    orderNew = 'desc'
  } else {
    orderNew = ''
  }

  $target
    .removeClass('grid-heading-is-order-asc')
    .removeClass('grid-heading-is-order-desc')
    .data(dataKey, orderNew)

  if (orderNew) {
    $target.addClass('grid-heading-is-order-' + orderNew)
  }

  readModel[dataKey][colKey] = orderNew
  storeReadModel(grid, readModel)

  read(grid)
}

function getOptionsDefaults(grid) {
  return {
    id: '', // string to give this grid a unique identity
    perPageOptions: [10, 25, 50, 100, 200],
    customiseCols: true,
    url: {
      create: '',
      read: '',
      update: '',
      delete: ''
    },
    cols: [
      // {
      //   width: 5,
      //   key: 'id',
      //   name: 'ID',
      //   primaryKey: true,
      //   search: true,
      //   order: true,
      //   edit: false,
      //   readTemplate: '<a href="#" class="link">{{.}}</a>'
      // }
    ],
    onSelectCell: function() {},
    onSelectRow: function() {}
  }
}

function getReadModelDataDefaults(grid) {
  return {
    visibility: {},
    search: {},
    order: {},
    rowsPerPage: grid.options.perPageOptions[0],
    pageCurrent: 1
  }
}

// build a model which can be interpreted by the read method in php
// searches
// ordering
// pagination
function getAjaxReadData(grid) {
  var data = getReadModel(grid)

  // page
  $pageSelect = grid.$container.find(gS(classes.pageSelect))
  if ($pageSelect.length) {
    data.pageCurrent = $pageSelect.val()
  }

  // per page
  $perPageSelect = grid.$container.find(gS(classes.perPageSelect))
  if ($perPageSelect.length) {
    data.rowsPerPage = $perPageSelect.val()
    grid.rowsPerPage = $perPageSelect.val() // store in memory
  }

  // search
  var $searchInputs = grid.$container.find(gS(classes.searchField))
  if ($searchInputs.length) {
    for (var index = $searchInputs.length - 1; index >= 0; index--) {
      var $searchInput = $($searchInputs[index])
      var key = $searchInput.closest(gS(classes.cellHeading)).data('key')
      var value = $searchInput.val()
      if (value !== ' ' && value) { // empty search value, better way?
        data.search[key] = value
      }
    }
  }

  // ordering
  var $headingCells = grid.$container.find(gS(classes.cellHeading))
  for (var index = $headingCells.length - 1; index >= 0; index--) {
    $headingCell = $($headingCells[index])
    if ($headingCell.data('order')) {
      var key = $headingCell.data('key')
      var value = $headingCell.data('order')
      data.order[key] = value
    }
  }

  return data
}

function markContainerFiltering(grid) {
  grid.$container.removeClass('grid-is-filtering')
  if (isFilterActive(grid)) {
    grid.$container.addClass('grid-is-filtering')
  }
}

function isFilterActive(grid) {
  var readModel = getStoredReadModel(grid)
  return !$.isEmptyObject(readModel.search) || !$.isEmptyObject(readModel.order) || readModel.rowsPerPage != grid.options.perPageOptions[0] || readModel.pageCurrent != 1 || isAnyColInvisible(readModel)
}

function isAnyColInvisible(readModel) {
  for (key in readModel.visibility) {
    if (!readModel.visibility[key]) {
      return true
    }
  }
}

function onMouseUpCell(grid, $target) {

  // no target
  if (!$target.length) {
    return cellDeselect(grid)
  }

  // is cell and selected
  if ($target.hasClass(classes.cell) && $target.hasClass(classes.selected)) {
    return
  }

  // is cell and not selected
  // deselect then select
  if ($target.hasClass(classes.cell)) {
    cellDeselect(grid, {persist: true})
    cellSelect(grid, $target)
  }
}

function getModelByIndex(grid, index) {
  var key = grid.$container.find(gS(classes.cellHeading)).eq(index).data('key')
  return getModelByKey(grid, key)
}

function getModelByKey(grid, key) {
  var theCol
  grid.options.cols.forEach(function(col) {
    if (col.key == key) {
      theCol = col
    }
  })
  return theCol
}

// deselect row by removing classes
function rowDeselect(grid) {
  var $selectedRow = getSelectedRow(grid)
  if (!$selectedRow.length) {
    return
  }
  $selectedRow.removeClass(classes.selected)
}

function getSelectedRow(grid) {
  return grid.$container.find(gS(classes.row) + gS(classes.selected))
}

function getSelectedCell(grid) {
  return grid.$container.find(gS(classes.cell) + gS(classes.selected))
}

// deselect cell with options relating to persistence
function cellDeselect(grid, cellOptions) {
  var $selectedRow = getSelectedRow(grid)
  var wasChanged
  var cellOptionsDefaults = {
    persist: false,
    revert: false
  }
  cellOptions = $.extend(cellOptionsDefaults, typeof cellOptions === 'undefined' ? {} : cellOptions)

  if (!$selectedRow.length) {
    return
  }

  var primaryKeyValue = getSelectedRowPrimaryValue(grid)
  var $selectedCell = getSelectedCell(grid)

  if (!$selectedCell.length) {
    return
  }

  var newValue = getSelectedCellInputValue(grid)
  var model = getModelByIndex(grid, $selectedCell.index())

  // deselect visibly
  rowDeselect(grid)
  $selectedCell.removeClass(classes.selected)

  // not editable
  if (!('update' in grid.options.url) || ('edit' in model && !model.edit)) {
    return
  }

  var $selectedCellInput = $selectedCell.find(gS(classes.input))
  var cellHtml
  var persistedValue = getRowCellValue(grid, $selectedCell)

  if (newValue == persistedValue) {
    wasChanged = false
  } else {
    wasChanged = true
  }

  // get selected option html
  var type = getInputTypeFromModel(model)

  // select needs to get the display name from the key
  if (type == 'select') {
    for (var key in model.selectOptions) {
      if (key == newValue) {
        cellHtml = model.selectOptions[key]
      }
    }

  // store the new value in data
  // put in html the display name of it
  } else if (cellOptions.revert) {
    cellHtml = persistedValue
  } else {
    cellHtml = newValue
  }

  if (model.type != 'html') {
    $selectedCell.html(cellHtml)
  }

  if (cellOptions.persist && wasChanged) {

    // perform persist update
    data = {}
    data[grid.primaryKey] = primaryKeyValue
    data['name'] = model.key
    data['value'] = newValue

    update(grid, data)
  }
}

function getSelectedCellInputValue(grid) {
  var $selectedCellInput = getSelectedCell(grid).find(gS(classes.input))
  if ($selectedCellInput.length) {
    return $selectedCellInput.val()
  } else if (typeof tinymce.activeEditor !== 'undefined' && tinymce.activeEditor) { // html
    return tinymce.activeEditor.getContent()
  }
}

// persist a row cell
function update(grid, data) {
  $.ajax({
    type: 'post',
    url: grid.options.url.update,
    dataType: 'json',
    data: data,
    success: function(response) {
      if ('rowCount' in response && response.rowCount == 1) {
        feedbackQueue.createMessage({message: 'Updated row \'' + data.name + '\' with value \'' + data.value + '\'.', type: 'success'})
        read(grid)
        dialogueCellWysi.close()
      }
    },
    error: function(response) {
      feedbackQueue.createMessage({message: 'There was a problem while updating the row.'})
    }
  })
}

function createRow(grid) {
  var data = {columns: {}}
  var $formCreateCells = $(gS(classes.formCreateCell))
  var $formCreateCell
  for (var i = $formCreateCells.length - 1; i >= 0; i--) {
    $formCreateCell = $($formCreateCells[i])
    data.columns[$formCreateCell.prop('name')] = $formCreateCell.val()
  }
  $.ajax({
    type: 'get',
    url: grid.options.url.create,
    dataType: 'json',
    data: data,
    success: function(response) {
      if ('rowCount' in response && response.rowCount == 1) {
        feedbackQueue.createMessage({message: 'Created row.', type: 'success'})
        dialogueCreate.close()
        read(grid)
      } else {
        feedbackQueue.createMessage({message: 'Row was not created.'})
      }
    },
    error: function(response) {
      feedbackQueue.createMessage({message: 'There was a problem while creating the row.'})
    }
  })
}

// returns the selected row primary value
function getSelectedRowPrimaryValue(grid) {
  var $selectedRow = getSelectedRow(grid)
  var $selectedCell = getSelectedCell(grid)
  var $primaryHeadingCell = grid.$container.find(gS(classes.cellHeading) + '[data-key="' + grid.primaryKey + '"]')
  var $primaryCell = $selectedRow.find(gS(classes.cell)).eq($primaryHeadingCell.index())

  return getRowCellValue(grid, $primaryCell)
}

// using model get the input type
function getInputTypeFromModel(model) {
  if ('selectOptions' in model) {
    return 'select'
  } else if ('type' in model) {
    return model.type
  } else {
    return ''
  }
}

function selectRowByCell(grid, $cell) {

  // deselect all rows
  grid.$container
    .find(gS(classes.row))
    .removeClass(classes.selected)

  // select row closest to cell
  $cell
    .closest(gS(classes.row))
    .addClass(classes.selected)
}

// switch the data out with an input / select
function cellSelect(grid, $cell) {
  var template
  var data = []
  var model = getModelByIndex(grid, $cell.index())
  var type = getInputTypeFromModel(model)
  var persistedValue = getRowCellValue(grid, $cell)
  
  selectRowByCell(grid, $cell)
  
  var passBack = {
    primaryKeyValue: getSelectedRowPrimaryValue(grid),
    cellValue: persistedValue,
    cellType: type,
    model: model
  }

  grid.options.onSelectCell.call(passBack)
  grid.options.onSelectRow.call(passBack)

  // not editable
  if (!('update' in grid.options.url) || ('edit' in model && !model.edit)) {
    return
  }

  $cell.addClass(classes.selected)

  // replace html for input using data value
  if (type == 'html') {
    dialogueCellWysi.create({
      mask: true,
      hardClose: true,
      width: 500,
      html: mustache.render('<textarea class="js-grid-dialogue-wysi-textarea">{{html}}</textarea>', {html: persistedValue}),
      onClose: function() {
        cellDeselect(grid, {revert: true})
        if (typeof tinymce.activeEditor !== 'undefined') {
          tinymce.activeEditor.remove()
        }
      },
      onComplete: function() {
        tinymce.init(tinymceConfig)
      },
      actions: {
        Save: function() {
          cellDeselect(grid, {persist: true})
          dialogueCellWysi.close()
        }
      }
    })
  } else if (type == 'select') {
    template = templateSelect
    data.options = model.selectOptionsKeyValue
    data.classNames = ['grid-cell-input', classes.input]
    for (var index = data.options.length - 1; index >= 0; index--) {
      data.options[index].keySelected = persistedValue == data.options[index].key
    }
  } else {
    template = templateInput
    data = {type: 'text', value: persistedValue}
  }

  if (type != 'html') {
    $cell.html(mustache.render(template, data))
    $cell.find(gS(classes.input)).val(persistedValue).focus().select()
  }
}

function getRowCellValue(grid, $cell) {
  var rowPos = $cell.parent(gS(classes.row)).index() - 1
  var cellPos = $cell.index()
  if (!(rowPos in grid.rowsCurrent)) {
    return console.warn('getRowCellValue rowPos ' + rowPos + ' not found', grid.rowsCurrent);
  } else if (!(cellPos in grid.rowsCurrent[rowPos])) {
    return console.warn('getRowCellValue cellPos ' + cellPos + ' not found', grid.rowsCurrent);
  }
  return grid.rowsCurrent[rowPos][cellPos]
}

function getStorageKey(grid) {
  return 'mwyatt-grid-' + grid.options.id
}

function getStoredReadModel(grid) {
  var readModel = JSON.parse(localStorage.getItem(getStorageKey(grid)))
  return readModel ? readModel : {}
}

function storeReadModel(grid, readModel) {
  var readModelStore = getReadModelDataDefaults(grid)
  var objectProps = ['search', 'order']
  var objectProp

  // stripping away all empty keys
  for (var a = objectProps.length - 1; a >= 0; a--) {
    objectProp = objectProps[a]
    for (var key in readModel[objectProp]) {
      if (readModel[objectProp][key]) {
        readModelStore[objectProp][key] = readModel[objectProp][key]
      }
    }
  }
  readModelStore.visibility = readModel.visibility
  readModelStore.rowsPerPage = readModel.rowsPerPage
  readModelStore.pageCurrent = readModel.pageCurrent
  localStorage.setItem(getStorageKey(grid), JSON.stringify(readModelStore))
}

function checkBrowserSupport() {
  if (typeof console === 'undefined') {
    return alert('console is not defined')
  }
  if (typeof Math === 'undefined') {
    console.warn('Math object not defined', 'function renderPagination will suffer')
  }
  if (typeof localStorage === 'undefined') {
    console.warn('localStorage is not defined')
  }
  if (typeof JSON === 'undefined') {
    console.warn('JSON is not defined')
  }
}

module.exports = Grid
