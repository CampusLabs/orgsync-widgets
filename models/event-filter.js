//= require ./model.js

(function () {
  'use strict';

  var app = window.OrgSyncWidgets;

  var Model = app.Model;

  var EventFilter = app.EventFilter = Model.extend({
    defaults: {
      enabled: true
    },

    hex: function (scale) {
      var hex = this.get('color');
      if (scale) {
        var n = parseInt(hex, '16');
        var r = (n >> 16) & 0xFF;
        r += Math.floor((scale > 0 ? (255 - r) : r) * scale);
        var g = (n >> 8) & 0xFF;
        g += Math.floor((scale > 0 ? (255 - g) : g) * scale);
        var b = n & 0xFF;
        b += Math.floor((scale > 0 ? (255 - b) : b) * scale);
        n = (r << 16) + (g << 8) + b;
        hex = n.toString(16);
      }
      while (hex.length < 6) hex = '0' + hex;
      return hex;
    }
  });

  EventFilter.Collection = Model.Collection.extend({
    model: EventFilter,

    comparator: 'name'
  });
})();
