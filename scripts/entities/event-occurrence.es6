import _ from 'underscore';
import moment from 'moment-timezone';
import tz from 'tz';

module Base from 'entities/base';
module Event from 'entities/event';

var Model = Base.Model.extend({
  relations: {
    event: {hasOne: Event, fk: 'event_id'}
  },

  defaults: {
    tz: tz,
    visible: false
  },

  initialize: function () {

    // When the timezone changes, we need to destroy the cached starts and
    // ends moment instances so they can be regenerated with their new time.
    this.on('change:tz', function () {
      delete this._starts_at;
      delete this._ends_at;
    });
  },

  start: function () { return this.normalize('starts_at'); },

  end: function () { return this.normalize('ends_at'); },

  normalize: function (which) {
    var key = '_' + which;
    if (this[key]) return this[key];
    var date = moment.utc(this.get(which));
    var tz = this.get('tz');
    if (!this.get('event').get('is_all_day')) return date.tz(tz);

    // All day events should always be midnight to midnight in the timezone
    // they are being viewed in, regardless of the time zone they were created
    // in.
    return this[key] = moment.tz(date.format('YYYY-MM-DD'), tz);
  },

  isMultiDay: function () {
    var startDay = this.start().clone().startOf('day');
    return startDay.add('days', 1).isBefore(this.end());
  },

  matchesEventFilters: function (eventFilters) {
    if (!eventFilters.length) return true;
    return _.any(this.get('filters'), function (eventFilterId) {
      var eventFilter = eventFilters.get(eventFilterId);
      return eventFilter && eventFilter.get('enabled');
    });
  },

  webUrl: function () {
    var links = this.get('event').get('links');
    return links && links.web ? links.web + '/occurrences/' + this.id : '';
  },

  isGoing: function () {
    var rsvp = this.get('rsvp');
    return rsvp === 'Attending' || rsvp === 'Added by Admin';
  },

  isInvited: function () {
    return this.get('rsvp') === 'Invited';
  },

  isMaybeAttending: function () {
    return this.get('rsvp') === 'Maybe Attending';
  }
});

var Collection = Base.Collection.extend({
  model: Model,

  comparator: function (a, b) {
    var aStart = a.start();
    var bStart = b.start();
    if (!aStart.isSame(bStart)) return aStart.isBefore(bStart) ? -1 : 1;
    return a.get('event').get('title') < b.get('event').get('title') ? -1 : 1;
  },

  filterByDate: function (date) {
    var start = date.clone().startOf('day');
    var end = start.clone().add('day', 1);
    return new Collection(this.filter(function (eventOccurrence) {
      return start.isBefore(eventOccurrence.end()) &&
        end.isAfter(eventOccurence.start())
    }));
  }
});

export {Model, Collection};