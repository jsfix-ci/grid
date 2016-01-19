var $ = require('jquery');
var mustache = require('mustache');
var gridFactory = require('./grid');
var gridItem = new gridFactory();
var url = require('codex/utility/url');



gridItem.create({
  url: {
    read: url.generate(),
    update: url.generate(),
    delete: url.generate(),
    create: url.generate()
  }
  containerSelector: '.js-grid-item-container',
  id: 'item',
  onSelectTd: function(event) {
    console.log('onSelectCell', event);
  },
  onSelectTr: function(event) {
    console.log('onSelectRow', event);
  },
  cols: {
    'id': {
      primaryKey: true,
      name: 'ID',
      edit: false
    },
    'sku': {
      name: 'SKU',
      required: true
    },
    'barcode': {
      name: 'Barcode'
    },
    'alt-barcode': {
      name: 'Alt. Code'
    },
    'mpn': {
      name: 'MPN'
    },
    'name': {
      name: 'Name',
      required: true
    },
    'stock': {
      name: 'Stock',
      edit: false
    },
    'aloc-stock': {
      name: 'Aloc Stock',
      edit: false
    },
    'min-stock': {
      name: 'Min Stock',
      type: 'number',
      required: true
    },
    'location': {
      name: 'Location',
      type: 'select',
      selectOptions: {1: 'here', 2: 'there'}
    },
    'status': {
      name: 'Status',
      type: 'select',
      selectOptions: {
        Current: 'Current',
        Dropship: 'Dropship',
        Discontinued: 'Discontinued',
        Obsolete: 'Obsolete'
      }
    },
    'supplier': {
      name: 'Supplier',
      type: 'select',
      selectOptions: {
        1: 'China',
        2: 'Burnley',
      }
    },
    'cost-price': {
      name: 'Cst Price',
      type: 'number'
    },
    'requires-count': {
      name: 'Rq Count',
      search: true,
      edit: false,
      type: 'select',
      selectOptions: {
        yes: 'Yes',
        no: 'No'
      }
    },
    'print': {
      name: 'Print',
      edit: false
    },
    'composite': {
      name: 'Composite?',
      edit: false
    }
  },
});
