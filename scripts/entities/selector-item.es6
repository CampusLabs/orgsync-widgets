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
    return this.isArbitrary(attrs) ?
      'arbitrary_' + attrs.name :
      _str.underscored(attrs.type) + '_' + attrs.id;
  },

  isArbitrary: function (attrs) {
    if (!attrs) attrs = this.attributes;
    return attrs.id == null || attrs.type == null;
  }
});

var Collection = Base.Collection.extend({
  model: Model,

  sync: function (method, model, options) {
    model.trigger('request:start');
    live.send('selector', options.data, function (er, results) {
      model.trigger('request:end');
      if (er) return options.error(er);
      options.success(results);
    });
  }
});

export {Model, Collection};
