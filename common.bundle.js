var $ = require('jquery');
var mustache = require('mustache');
var gridFactory = require('./grid');
var gridItem = new gridFactory();
var gridBaby = new gridFactory();


gridItem.create({
  id: 'item',
  url: {
    read: 'request/read.php',
    update: 'request/update.php',
    delete: 'request/delete.php',
    create: 'request/create.php'
  },
  onSelectCell: function(model, type) {
    console.log('onSelectCell', this, model, type);
  },
  onSelectRow: function() {
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
      edit: true,
      required: true
    },
    {
      edit: true,
      key: 'barcode',
      name: 'Barcode'
    },
    {
      edit: true,
      key: 'alt-barcode',
      name: 'Alt. Code'
    },
    {
      edit: true,
      key: 'mpn',
      name: 'MPN'
    },
    {
      edit: true,
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
      edit: true,
      key: 'min-stock',
      name: 'Min Stock',
      type: 'number',
      required: true
    },
    {
      edit: true,
      key: 'location',
      name: 'Location',
      selectOptions: {1: 'here', 2: 'there'}
    },
    {
      edit: true,
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
      edit: true,
      key: 'supplier',
      name: 'Supplier',
      selectOptions: {
        1: 'China',
        2: 'Burnley',
      }
    },
    {
      edit: true,
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
  id: 'baby',
  url: {
    read: 'request/read-baby.php',
    update: 'request/update.php',
    delete: 'request/delete.php',
    create: 'request/create.php'
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
      edit: true,
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
