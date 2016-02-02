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
      order: true,
      edit: false
    },
    {
      key: 'sku',
      name: 'SKU',
      order: true,
      edit: true,
      type: 'text',
      required: true
    },
    {
      edit: true,
      order: true,
      type: 'text',
      key: 'barcode',
      name: 'Barcode'
    },
    {
      edit: true,
      order: true,
      type: 'text',
      key: 'altBarcode',
      name: 'Alt. Code'
    },
    {
      edit: true,
      order: true,
      type: 'text',
      key: 'mpn',
      name: 'MPN'
    },
    {
      edit: true,
      order: true,
      type: 'text',
      key: 'name',
      name: 'Name',
      required: true
    },
    {
      order: true,
      type: 'number',
      key: 'stock',
      name: 'Stock',
      edit: false
    },
    {
      type: 'number',
      key: 'alocStock',
      name: 'Aloc Stock',
      edit: false
    },
    {
      order: true,
      edit: true,
      key: 'minStock',
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
      order: true,
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
      search: true,
      selectOptions: {
        1: 'China',
        2: 'Burnley',
      }
    },
    {
      order: true,
      edit: true,
      key: 'costPrice',
      name: 'Cst Price',
      type: 'number'
    },
    {
      key: 'requiresCount',
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
