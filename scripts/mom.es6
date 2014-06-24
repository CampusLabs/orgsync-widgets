import _ from 'underscore';
import moment from 'moment-timezone';

var cache = _.memoize(function (date, tz) {
  return date && date.length === 10 ? moment.tz(date, tz) : moment(date).tz(tz);
}, function (date, tz) { return date + '/' + tz; });

export default function (date, tz) { return cache(date, tz).clone(); }
