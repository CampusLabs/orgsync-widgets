import _ from 'underscore';
import Model from 'models/model';

var Event = Model.extend({
  relations: {
    portal: {hasOne: 'portal', fk: 'portal_id'},
    creator: {hasOne: 'account', fk: 'creator_id'},
    dates: {hasMany: 'event-date', fk: 'event_id'},
    comments: {hasMany: 'comment', fk: 'event_id'},
  },

  parse: function (data) {
    data.dates = this.get('dates').models.concat(data.dates);
    return data;
  },

  orgsyncUrl: function () {
    return 'https://orgsync.com/' + this.get('portal').id + '/events/' +
      this.id;
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

Event.Collection = Model.Collection.extend({
  model: Event,

  comparator: 'name'
});

export default = Event;
