import _ from 'underscore';

module Base from 'entities/base';
module Album from 'entities/album';
module Category from 'entities/category';
module NewsPost from 'entities/news-post';
module Event from 'entities/event';

var Model = Base.Model.extend({
  relations: function () {
    return {
      umbrella: {hasOne: Model, fk: 'umbrella_id'},
      category: {hasOne: Category.Model, fk: 'category_id'},
      albums: {hasMany: Album.Collection, fk: 'portal_id'},
      newsPosts: {
        hasMany: NewsPost.Collection,
        fk: 'portal_id',
        urlRoot: '/news'
      },
      events: {hasMany: Event.Collection, fk: 'portal_id'}
    };
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

var Collection = Base.Collection.extend({
  model: Model,

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

export {Model, Collection};
