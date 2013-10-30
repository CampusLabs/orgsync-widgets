//= require model

(function () {
  'use strict';

  var app = window.OrgSyncWidgets;

  var _ = window._;
  var Model = app.Model;

  var Event = app.Event = Model.extend({
    relations: {
      portal: {hasOne: 'Portal', fk: 'portal_id'},
      creator: {hasOne: 'Account', fk: 'creator_id'},
      dates: {hasMany: 'EventDate', fk: 'event_id'},
      comments: {hasMany: 'Comment', fk: 'event_id'}
    },

    defaults: {
      visible: true,
    },

    searchableWords: function () {
      if (this._searchableWords) return this._searchableWords;
      return this._searchableWords = _.str.words(_.values(
        this.pick('title', 'description', 'location')
      ).join(' ').toLowerCase());
    },

    matchesQuery: function (query) {
      if (!query) return true;
      var words = _.str.words(query.toLowerCase());
      var searchableWords = this.searchableWords();
      return _.every(words, function (wordA) {
        return _.any(searchableWords, function (wordB) {
          return _.str.startsWith(wordB, wordA);
        });
      });
    },

    hex: function (scale) {
      var n = parseInt(this.get('color'), '16');
      if (isNaN(n)) this.set('color', (n = _.random(0xFFFFFF)).toString(16));
      if (scale) {
        var r = (n >> 16) % 256;
        r += Math.floor((scale > 0 ? (255 - r) : r) * scale);
        var g = (n >> 8) % 256;
        g += Math.floor((scale > 0 ? (255 - g) : g) * scale);
        var b = n % 256;
        b += Math.floor((scale > 0 ? (255 - b) : b) * scale);
        n = ((r << 16) + (g << 8) + b);
      }
      n = n.toString(16);
      while (n.length < 6) n = '0' + n;
      return '#' + n;
    }
  });

  Event.Collection = Model.Collection.extend({
    model: Event,

    comparator: 'name'
  });
})();
