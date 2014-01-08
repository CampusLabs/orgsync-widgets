import Model from 'models/model';
import tinycolor from 'tinycolor';

var EventFilter = Model.extend({
  defaults: {
    enabled: true
  },

  color: function () { return tinycolor(this.get('color')); }
});

EventFilter.Collection = Model.Collection.extend({
  model: EventFilter,

  comparator: 'name',

  constructor: function () {
    Model.Collection.apply(this, arguments);
    this.generateColors();
  },

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

export default = EventFilter;
