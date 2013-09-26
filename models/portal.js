//= require model

(function () {
  'use strict';

  var app = window.OrgSyncWidgets;

  var _ = window._;
  var Model = app.Model;

  var Portal = app.Portal = Model.extend({
    relations: {
      umbrella: {hasOne: 'Portal', fk: 'umbrella_id'},
      category: {hasOne: 'Category', fk: 'category_id'},
      albums: {hasMany: 'Album', fk: 'portal_id'},
      newsPosts: {hasMany: 'NewsPost', fk: 'portal_id', urlRoot: '/news'}
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
    },

    orgsyncUrl: function () {
      return 'https://orgsync.com/' + this.id + '/chapter';
    },

    isUmbrella: function () {
      var id = this.get('umbrella').id;
      return !id || id === this.id;
    },

    umbrellaName: function () {
      return this.isUmbrella() ? 'Umbrella' : this.get('umbrella').get('name');
    }
  });

  Portal.Collection = Model.Collection.extend({
    model: Portal,

    url: '/portals',

    comparator: function (a, b) {
      var aName = (a.get('name') || '').toLowerCase();
      var bName = (b.get('name') || '').toLowerCase();
      var aIsUmbrella = a.isUmbrella();
      var bIsUmbrella = b.isUmbrella();
      if (aIsUmbrella === bIsUmbrella) return aName < bName ? -1 : 1;
      return aIsUmbrella ? -1 : 1;
    }
  });
})();
