import tinycolor from 'tinycolor';

module Base from 'entities/base';

var Model = Base.Model.extend({
  defaults: {
    enabled: true
  },

  color: function () { return tinycolor(this.get('color')); }
});

var Collection = Base.Collection.extend({
  model: Model,

  comparator: function (a, b) {
    var aType = a.get('type');
    var bType = b.get('type');
    if (aType === 'rsvp') return -1;
    if (bType === 'rsvp') return 1;
    if (aType === 'featured') return -1;
    if (bType === 'featured') return 1;
    return a.get('name') < b.get('name') ? -1 : 1;
  },

  constructor: function () {
    Base.Collection.apply(this, arguments);
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

export {Model, Collection};
