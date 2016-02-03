var $ = require('jquery');
var mustache = require('mustache');
var gridFactory = require('./grid');
var gridItem = new gridFactory();
var gridBaby = new gridFactory();


gridItem.create({
  id: 'item',
  perPageOptions: [10, 25, 50, 100, 200],
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
      width: 10,
      key: 'id',
      name: 'ID',
      primaryKey: true,
      search: true,
      order: true,
      edit: false,
      readTemplate: '<a href="#" class="link-primary">{{.}}</a>'
    },
    {
      width: 6,
      search: true,
      key: 'sku',
      name: 'SKU',
      order: true,
      edit: true,
      type: 'text',
      required: true
    },
    {
      width: 6,
      edit: true,
      order: true,
      type: 'text',
      key: 'name',
      name: 'Name',
      required: true
    },
    {
      width: 6,
      order: true,
      type: 'number',
      key: 'stock',
      name: 'Stock',
      edit: false
    },
    {
      width: 6,
      order: true,
      search: true,
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
      width: 6,
      edit: true,
      key: 'supplier',
      name: 'Supplier',
      search: true,
      selectOptions: {
        16: 'China',
        2: 'Burnley',
      }
    },
    {
      width: 6,
      key: 'requiresCount',
      name: 'Rq Count',
      search: true,
      edit: false,
      selectOptions: {
        Yes: 'Yes',
        No: 'No'
      }
    },
    {
      width: 6,
      key: 'print',
      name: 'Print',
      edit: false
    }
  ]
});

gridBaby.create({
  id: 'baby',
  perPageOptions: [10, 25, 50, 100, 150],
  url: {
    read: 'request/read-baby.php',
    update: 'request/update.php',
    delete: 'request/delete.php'
  },
  cols: [
    {
      width: 50,
      key: 'id',
      name: 'ID',
      primaryKey: true,
      search: true,
      edit: false,
      readTemplate: '<a href="#" class="link-primary">{{.}}</a>'
    },
    {
      width: 20,
      edit: true,
      key: 'cost-price',
      name: 'Cst Price',
      type: 'number'
    },
    {
      width: 30,
      key: 'composite',
      name: 'Composite?',
      edit: false
    }
  ]
});
