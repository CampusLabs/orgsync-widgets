import _ from 'underscore';
import _str from 'underscore.string';
import api from '../utils/api';
import moment from 'moment-timezone';

var PER_PAGE = 100;

var cache = _.memoize(moment.tz, function (date, tz) {
  return date + '/' + tz;
});

export var getMoment = function (date, tz) { return cache(date, tz).clone(); };

export var getDaySpan = function (start, end, tz) {
  return Math.ceil(
    getMoment(end, tz).diff(getMoment(start, tz).startOf('day'), 'days', true)
  );
};

export var isAllDay = function (event, tz) {
  if (event.is_all_day) return true;
  var startMom = getMoment(event.starts_at, tz);
  var endMom = getMoment(event.ends_at, tz);
  return startMom.isSame(startMom.clone().startOf('day')) &&
    endMom.isSame(endMom.clone().startOf('day'));
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
  return match && match.hex;
};

var fixDate = function (date, isAllDay) {
  return isAllDay ? date.slice(0, 10) : moment.utc(date).toISOString();
};

export var mergeResponse = function (a, b) {
  var isAllDay = a.is_all_day;
  return _.extend({}, a, b, {
    starts_at: fixDate(b.starts_at, isAllDay),
    ends_at: fixDate(b.ends_at, isAllDay)
  });
};

export var parseResponse = function (res) {
  return _.flatten(_.map(res.data, function (event) {
    return _.map(event.dates, _.partial(mergeResponse, event));
  }));
};

export var comparator = function (tz, a, b) {
  if (a.is_all_day !== b.is_all_day) return a.is_all_day ? -1 : 1;
  if (a.is_all_day) {
    var aDaySpan = getDaySpan(a.starts_at, a.ends_at, tz);
    var bDaySpan = getDaySpan(b.starts_at, b.ends_at, tz);
    if (aDaySpan !== bDaySpan) return aDaySpan > bDaySpan ? -1 : 1;
  }
  if (a.starts_at !== b.starts_at) return a.starts_at < b.starts_at ? -1 : 1;
  if (a.title !== b.title) return a.title < b.title ? -1 : 1;
  return 0;
};

export var merge = function (a, b) {
  return a.concat(_.reject(b, function (event) {
    return _.any(a, _.matches({id: event.id}));
  }));
};

export var getNextContiguous = function (after, ranges) {
  ranges = _.sortBy(ranges, 0);
  for (var i = 0, l = ranges.length; i < l; ++i) {
    var range = ranges[i];
    if (after >= range[0] && after < range[1]) after = range[1];
  }
  return after;
};

export var getPrevContiguous = function (before, ranges) {
  ranges = _.sortBy(ranges, 1);
  for (var i = ranges.length - 1; i >= 0; --i) {
    var range = ranges[i];
    if (before <= range[1] && before > range[0]) before = range[0];
  }
  return before;
};

var handleFetch = function (options, cb, er, res) {
  if (er) return cb(er);
  var after = options.after;
  var before = options.before;
  var events = parseResponse(res);
  if (events.length === PER_PAGE) {
    if (options.direction === 'backwards') {
      after = _.first(_.sortBy(events, 'ends_at')).ends_at;
    } else {
      before = _.last(_.sortBy(events, 'starts_at')).starts_at;
    }
  }
  var ranges = options.ranges.concat([[after, before]]);
  events = merge(options.events, events);
  cb(null, ranges, events);
};

export var fetch = function (options, cb) {
  options = _.clone(options);
  var ranges = options.ranges;
  options.after = getNextContiguous(options.after, ranges);
  options.before = getPrevContiguous(options.before, ranges);
  if (options.after >= options.before) return cb();
  api.get(options.url, {
    upcoming: true,
    per_page: PER_PAGE,
    after: options.after,
    before: options.before,
    direction: options.direction,
    restrict_to_portal: options.scope === 'portal' ? false : undefined,
    include_opportunities: options.scope === 'community' ? true : undefined,
    statuses: options.statuses
  }, _.partial(handleFetch, options, cb));
};
