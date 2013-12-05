//= require ./model.js

(function () {
  'use strict';

  var app = window.OrgSyncWidgets;

  var _ = window._;
  var Model = app.Model;

  // NOTE: Temp data while endpoint is created.
  var tags = [{
    id: "umbrella-1",
    name: "Student Life",
    color: "FF0000"
  }, {
    id: "umbrella-2",
    name: "Rec Sports",
    color: "00FF00"
  }, {
    id: "umbrella-3",
    name: "Frat Life",
    color: "0000FF"
  }];


  var Event = app.Event = Model.extend({
    relations: {
      portal: {hasOne: 'Portal', fk: 'portal_id'},
      creator: {hasOne: 'Account', fk: 'creator_id'},
      dates: {hasMany: 'EventDate', fk: 'event_id'},
      comments: {hasMany: 'Comment', fk: 'event_id'},
      tags: {hasMany: 'EventFilter'}
    },

    // NOTE: Temp defaults until response returns `tags`.
    defaults: function () {
      return {visible: true, tags: _.sample(tags)};
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

    matchesEventFilters: function (eventFilters) {
      if (!eventFilters.length) return true;
      var tags = this.get('tags');
      return eventFilters.any(function (eventFilter) {
        return eventFilter.get('enabled') && tags.get(eventFilter);
      }, this);
    },

    hex: function (scale) {
      return this.get('tags').first().hex(scale);
    },

    parse: function (data) {
      data.dates = this.get('dates').models.concat(data.dates);
      return data;
    },

    orgsyncUrl: function (eventDate) {
      var url = 'https://orgsync.com/' + this.get('portal').id +
        '/events/' + this.id;
      if (eventDate) url += '?date=' + eventDate.start().format('YYYY-MM-DD');
      return url;
    }
  });

  Event.Collection = Model.Collection.extend({
    model: Event,

    comparator: 'name'
  });
})();
