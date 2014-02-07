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
    $.ajax({url: 'http://orgsync.com.dev/io/live-key', success: _.partial(cb, null), error: cb});
  }
});

var Model = Base.Model.extend({
  parse: function (data) {
    return {
      id: _str.underscored(data.type) + '_' + data.id,
      name: data.name
    };
  },

  toSelectize: function () {
    return {value: JSON.stringify(this), text: this.get('name')};
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
