module.exports = {
  id: '', // string to give this grid a unique identity
  perPageOptions: [10, 25, 50, 100, 200],
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
