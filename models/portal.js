//= require model

(function () {
  'use strict';

  var app = window.OrgSyncWidgets;

  var _ = window._;
  var Model = app.Model;

  var Portal = app.Portal = Model.extend({
    relations: {
      umbrella: {hasOne: 'Portal', fk: 'umbrella_id'},
      category: {hasOne: 'Category', fk: 'category_id'}
    },

    defaultPicture: 'https://orgsync.com/assets/no_org_profile_150.png',

    urlRoot: '/portals',

    searchableWords: function () {
      if (this._searchableWords) return this._searchableWords;
      return this._searchableWords = _.str.words(_.values(
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
    },

    picture: function () {
      return this.get('picture_url') || this.defaultPicture;
    }
  });

  Portal.Collection = Model.Collection.extend({
    model: Portal,

    url: '/portals',

    comparator: function (portal) {
      return (portal.get('name') || '').toLowerCase();
    }
  });
})();
