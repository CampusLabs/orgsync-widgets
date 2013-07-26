//= require model

(function () {
  'use strict';

  var app = window.OrgSyncWidgets;

  var _ = window._;
  var Model = app.Model;

  var umbrellas = {};
  var categories = {};

  var Portal = app.Portal = Model.extend({
    relations: {
      umbrella: {hasOne: 'Portal', fk: 'umbrella_id'},
      category: {hasOne: 'Category', fk: 'category_id'}
    },

    initialize: function () {
      if (!this.get('picture_url')) {
        this.set('picture_url', this.defaultPicture);
      }
    },

    defaultPicture: 'https://orgsync.com/assets/no_org_profile_150.png',

    apiWrapper: 'portal',

    urlRoot: '/portals',

    searchableWords: function () {
      if (this._searchableWords) return this._searchableWords;
      this._searchableWords = _.str.words(_.values(
        this.pick('name', 'short_name', 'keywords')
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
    }
  });

  Portal.Collection = Model.Collection.extend({
    apiWrapper: 'portals',

    model: Portal,

    url: '/portals',

    comparator: 'name',

    // HACKY HACKY til the API is updated
    parse: function (data) {
      if (!data || !data[0] || !data[0].portal) return data;
      return _.map(data, function (data) {
        var portal = data.portal;
        delete data.portal;
        var umbrella = data.umbrella;
        data.umbrella = {
          id: umbrellas[umbrella] || (umbrellas[umbrella] = _.uniqueId()),
          name: umbrella
        };
        var category = data.category;
        data.category = {
          id: categories[category] || (categories[category] = _.uniqueId()),
          name: category
        };
        return _.extend(data, portal);
      });
    }
  });
})();
