var $ = require('jquery');
var gridFactory = require('./grid');
var gridPrimary = new gridFactory();
var gridSecondary = new gridFactory();

gridPrimary.create({
  id: 'primary',
  perPageOptions: [10, 25, 50, 100, 200],
  url: {
    // create: 'request/grid-primary/create.php',
    read: 'request/grid-primary/read.php'
    // update: 'request/grid-primary/update.php',
    // delete: 'request/grid-primary/delete.php'
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
      edit: false,
      type: 'text',
      required: true
    },
    {
      width: 6,
      edit: false,
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
      edit: false,
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
      edit: false,
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

gridSecondary.create({
  id: 'secondary',
  perPageOptions: [10, 25, 50, 100, 150],
  url: {
    create: 'request/grid-secondary/create.php',
    read: 'request/grid-secondary/read.php',
    update: 'request/grid-secondary/update.php',
    delete: 'request/grid-secondary/delete.php'
  },
  cols: [
    {
      key: 'id',
      name: 'ID',
      edit: false,
      primaryKey: true
    },
    {
      search: true,
      edit: true,
      key: 'sku',
      name: 'SKU'
    },
    {
      search: true,
      key: 'barcode',
      name: 'Barcode',
      edit: true
    }
  ]
});
