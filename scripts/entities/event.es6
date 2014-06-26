import _ from 'underscore';
import _str from 'underscore.string';
import moment from 'moment-timezone';

var cache = _.memoize(function (date, tz) {
  return date && date.length === 10 ?
    moment.tz(date, tz) :
    moment.utc(date).tz(tz);
}, function (date, tz) { return date + '/' + tz; });

export var mom = function (date, tz) { return cache(date, tz).clone(); };

export var getDaySpan = function (start, end, tz) {
  return Math.ceil(
    mom(end, tz).diff(mom(start, tz).startOf('day'), 'days', true)
  );
};

var searchableWords = function (event) {
  return _str.words(_.values(
    _.pick(event, 'title', 'description', 'location')
  ).join(' ').toLowerCase());
};

var matchesQuery = function (event, query) {
  if (!query) return true;
  var words = _str.words(query.toLowerCase());
  var searchable = searchableWords(event);
  return _.every(words, function (wordA) {
    return _.any(searchable, function (wordB) {
      return _str.startsWith(wordB, wordA);
    });
  });
};

var matchesFilters = function (event, filters) {
  return _.any(event.filters, _.partial(_.contains, _.pluck(filters, 'id')));
};

export var matchesQueryAndFilters = function (event, query, filters) {
  return matchesFilters(event, filters) && matchesQuery(event, query);
};

export var getColor = function(event, filters) {
  var match = _.find(filters, function (filter) {
    return _.contains(event.filters, filter.id);
  });
  return match && match.color;
};
