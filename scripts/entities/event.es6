import _ from 'underscore';

module Base from 'entities/base';
module Portal from 'entities/portal';
module Account from 'entities/account';
module EventDate from 'entities/event-date';
module Comment from 'entities/comment';

var Model = Base.Model.extend({
  relations: {
    portal: {hasOne: Portal, fk: 'portal_id'},
    creator: {hasOne: Account, fk: 'creator_id'},
    dates: {hasMany: EventDate, fk: 'event_id'},
    comments: {hasMany: Comment, fk: 'event_id'}
  },

  parse: function (data) {
    data = _.clone(data);
    data.dates = this.get('dates').models.concat(data.dates);
    return data;
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
  }
});

var Collection = Base.Collection.extend({
  model: Model,

  comparator: 'name'
});

export {Model, Collection};
