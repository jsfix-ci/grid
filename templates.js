var templates = {
  noRowsPane: '<div class="grid-no-rows js-grid-no-rows"><p>No Results, <span class="link-primary js-grid-button-remove-filters">Remove Filters</span>.</p></div>',
  deleteButton: '<span title="Delete row" class="grid-row-button-delete js-grid-row-button-delete">&times;</span>',
  input: '<input class="grid-cell-input js-grid-cell-input" type="{{type}}" value="{{value}}">',
  select: '<select class="{{#classNames}}{{.}} {{/classNames}}">{{#options}}<option value="{{key}}" {{#keySelected}}selected{{/keySelected}}>{{value}}</option>{{/options}}</select>',
  spinner: '<div class="grid-spinner js-grid-spinner"><div class="grid-spinner-single"></div></div>'
};

templates.rows = [
  '{{#.}}',

  '<tr class="grid-row js-grid-row">',

    '{{#.}}',

    '<td class="grid-cell-base grid-cell grid-td js-grid-cell" data-value="{{value}}">{{{html}}}</td>',

    '{{/.}}',

  '</tr>',

  '{{/.}}'
].join('\n');

templates.formCreate = [
  '<form class="grid-form-create js-grid-form-create">',
  '{{#.}}',
  '<div class="grid-form-create-row">',
  '<label class="grid-form-create-label">{{name}}</label>',
  '{{^selectOptionsKeyValue.length}}',
  '<input class="grid-form-create-input js-form-create-cell" type="{{inputType}}" name="{{key}}">',
  '{{/selectOptionsKeyValue.length}}',
  '{{#selectOptionsKeyValue.length}}',
  '<select class="grid-form-create-select js-form-create-cell" name="{{key}}">',
  '{{#selectOptionsKeyValue}}',
  '<option value="{{key}}">{{value}}</option>',
  '{{/selectOptionsKeyValue}}',
  '</select>',
  '{{/selectOptionsKeyValue.length}}',
  '</div>',
  '{{/.}}',
  '</form>'
].join('\n');

templates.grid = [
  '<div class="grid-button-remove-filters js-grid-button-remove-filters">Remove Filters</div>',
  '<table class="grid-table js-grid-table">',
    '<tr class="js-grid-row-heading">',

    '{{#cols}}',

    '<th {{#width}}style="width: {{width}}%;" {{/width}}class="grid-cell-base grid-cell-heading js-grid-cell-heading {{#order}}grid-cell-heading-orderable js-grid-cell-heading-orderable{{/order}}" data-key="{{key}}">',
      '<div class="grid-cell-heading-name">{{name}}</div>',

      '{{#search}}',
        '{{#selectOptionsKeyValue.length}}',

      '<div class="grid-heading-search-container">',
        '<select name="" id="" class="js-grid-search-field js-grid-search-select">',
          '<option value=" "></option>',

          '{{#selectOptionsKeyValue}}',

          '<option value="{{key}}"{{#selected}} selected{{/selected}}>{{value}}</option>',

          '{{/selectOptionsKeyValue}}',

        '</select>',
      '</div>',

      '{{/selectOptionsKeyValue.length}}',
      '{{^selectOptionsKeyValue.length}}',

      '<input type="text" class="grid-search-input js-grid-search-field js-grid-search-input" placeholder="Search" value="{{searchDefaultValue}}">',

        '{{/selectOptionsKeyValue.length}}',
      '{{/search}}',

    '</th>',

    '{{/cols}}',

    '</tr>',
  '</table>',
  '<div class="grid-pagination-container js-grid-pagination-container"></div>',

  '{{#url.create}}',

  '<button class="grid-button-create js-grid-button-create">Create</button>',

  '{{/url.create}}'
].join('\n');

templates.pagination = [
  'page',

  '{{#selectPages}}',
    '{{> select}}',
  '{{/selectPages}}',

  'of {{possiblePages}}',
  'per page',

  '{{#selectPerPage}}',
    '{{> select}}',
  '{{/selectPerPage}}',

  '<span class="grid-total-rows">{{rowsTotal}}</span>'
].join('\n');

module.exports = templates;
