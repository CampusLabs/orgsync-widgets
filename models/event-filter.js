//= require ./model.js

(function () {
  'use strict';

  var app = window.OrgSyncWidgets;

  var tinycolor = window.tinycolor;
  var Model = app.Model;

  var EventFilter = app.EventFilter = Model.extend({
    defaults: {
      enabled: true
    },

    color: function () { return tinycolor(this.get('color')); }
  });

  EventFilter.Collection = Model.Collection.extend({
    model: EventFilter,

    comparator: 'name',

    initialize: function () { this.on('sort', this.generateColors); },

    generateColors: function () {
      var step = 360 / this.length;
      this.each(function (eventFilter, i) {
        eventFilter.set(
          'color',
          tinycolor({h: i * step, s: 1, l: 0.5}).toHex()
        );
      });
    }
  });
})();
