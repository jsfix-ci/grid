var $ = require('jquery');
var mustache = require('mustache');
var gridFactory = require('./grid');
var gridItem = new gridFactory();
var gridBaby = new gridFactory();


gridItem.create({
  url: {
    read: 'request/read.php',
    update: 'request/update.php',
    delete: 'request/delete.php',
    create: 'request/create.php'
  },
  containerSelector: '.js-grid-item-container',
  id: 'item',
  onSelectTd: function() {
    console.log('onSelectCell', this);
  },
  onSelectTr: function() {
    console.log('onSelectRow', this);
  },
  cols: [
    {
      key: 'id',
      name: 'ID',
      primaryKey: true,
      search: true,
      edit: false
    },
    {
      key: 'sku',
      name: 'SKU',
      required: true
    },
    {
      key: 'barcode',
      name: 'Barcode'
    },
    {
      key: 'alt-barcode',
      name: 'Alt. Code'
    },
    {
      key: 'mpn',
      name: 'MPN'
    },
    {
      key: 'name',
      name: 'Name',
      required: true
    },
    {
      key: 'stock',
      name: 'Stock',
      edit: false
    },
    {
      key: 'aloc-stock',
      name: 'Aloc Stock',
      edit: false
    },
    {
      key: 'min-stock',
      name: 'Min Stock',
      type: 'number',
      required: true
    },
    {
      key: 'location',
      name: 'Location',
      selectOptions: {1: 'here', 2: 'there'}
    },
    {
      key: 'status',
      name: 'Status',
      selectOptions: {
        Current: 'Current',
        Dropship: 'Dropship',
        Discontinued: 'Discontinued',
        Obsolete: 'Obsolete'
      }
    },
    {
      key: 'supplier',
      name: 'Supplier',
      selectOptions: {
        1: 'China',
        2: 'Burnley',
      }
    },
    {
      key: 'cost-price',
      name: 'Cst Price',
      type: 'number'
    },
    {
      key: 'requires-count',
      name: 'Rq Count',
      search: true,
      edit: false,
      selectOptions: {
        yes: 'Yes',
        no: 'No'
      }
    },
    {
      key: 'print',
      name: 'Print',
      edit: false
    },
    {
      key: 'composite',
      name: 'Composite?',
      edit: false
    }
  ]
});

gridBaby.create({
  url: {
    read: 'request/read-baby.php',
    update: 'request/update.php',
    delete: 'request/delete.php',
    create: 'request/create.php'
  },
  containerSelector: '.js-grid-baby-container',
  id: 'baby',
  cols: [
    {
      key: 'id',
      name: 'ID',
      primaryKey: true,
      search: true,
      edit: false
    },
    {
      key: 'cost-price',
      name: 'Cst Price',
      type: 'number'
    },
    {
      key: 'composite',
      name: 'Composite?',
      edit: false
    }
  ]
});
