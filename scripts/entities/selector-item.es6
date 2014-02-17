import _ from 'underscore';
import _str from 'underscore.string';
import $ from 'jquery';
module Base from 'entities/base';
import Live from 'live';
import SockJS from 'sockjs';

var live = new Live({
  url: 'http://orgsync.com.dev/io/live',

  socketConstructor: SockJS,

  fetchAuthKey: function (cb) {
    $.ajax({
      url: 'http://orgsync.com.dev/io/live-key',
      success: _.partial(cb, null),
      error: cb
    });
  }
});

var Model = Base.Model.extend({
  generateId: function (attrs) {
    return attrs.id ?
      _str.underscored(attrs.type) + '_' + attrs.id :
      'arbitrary_' + attrs.name;
  },

  isArbitrary: function () {
    return this.get('id') == null || this.get('type') == null;
  }
});

var Collection = Base.Collection.extend({
  model: Model,

  sync: function (method, model, options) {
    live.send('selector', options.data, function (er, results) {
      if (er) return options.error(er);
      options.success(results);
    });
  }
});

export {Model, Collection};
