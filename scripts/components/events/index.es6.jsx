/** @jsx React.DOM */

import _ from 'underscore';
import api from 'api';
import Calendar from 'components/events/calendar';
import Cursors from 'cursors';
import EventFiltersIndex from 'components/event-filters/index';
import {mom, getDaySpan, matchesQueryAndFilters} from 'entities/event';
import React from 'react';
import tinycolor from 'tinycolor';
import tz from 'tz';

var RSVP_COLOR = '94b363';
var FILTERED_EVENTS_MODIFIER_KEYS = ['events', 'query', 'filters'];

export default React.createClass({
  mixins: [Cursors],

  getDefaultProps: function () {
    return {
      events: [],
      query: '',
      filters: [],
      tz: tz,
      target: mom(void 0, tz)
        .startOf('month')
        .startOf('week')
        .format('YYYY-MM-DD')
    };
  },

  getInitialState: function () {
    return {
      events: this.props.events,
      filters: this.props.filters,
      filteredEvents: [],
      query: this.props.query,
      tz: this.props.tz,
      target: this.props.target
    };
  },

  componentWillMount: function () {
    this.updateFilteredEvents();
    this.testFetch();
  },

  componentDidUpdate: function (__, prevState) {
    if (this.filteredEventsShouldUpdate(prevState)) {
      console.log('should filter');
      this.updateFilteredEvents();
    }
  },

  filteredEventsShouldUpdate: function (prevState) {
    return _.any(FILTERED_EVENTS_MODIFIER_KEYS, function (key) {
      return prevState[key] !== this.state[key];
    }, this);
  },

  updateFilteredEvents: function () {
    var events = this.state.events;
    var query = this.state.query;
    var filters = _.filter(this.state.filters, _.matches({active: true}));
    var matches = _.partial(matchesQueryAndFilters, _, query, filters);
    this.update('filteredEvents', {$set: _.filter(events, matches)});
  },

  testFetch: function () {
    api.get('/accounts/events', {
      upcoming: true,
      per_page: 100,
      after: this.props.target
    }, this.handleTestFetch);
    api.get('/accounts/events/filters', this.handleFiltersFetch);
  },

  getFilterColor: function (filter, i, filters) {
    return filter.color || (
      filter.type === 'rsvp' ?
      RSVP_COLOR :
      tinycolor({h: i * (filters.length / 360), s: 1, l: 0.4}).toHex()
    );
  },

  handleFiltersFetch: function (er, res) {
    var getFilterColor = this.getFilterColor;
    var filters = res.data;
    this.update('filters', {$set: _.map(filters, function (filter, i) {
      return _.extend({}, filter, {
        color: getFilterColor(filter, i, filters),
        active: true
      });
    })});
  },

  parseDate: function (date, isAllDay) {
    return isAllDay ? date.slice(0, 10) : (new Date(date)).toISOString();
  },

  comparator: function (a, b) {
    if (a.is_all_day !== b.is_all_day) return a.is_all_day ? -1 : 1;
    if (a.is_all_day) {
      var tz = this.state.tz;
      var aDaySpan = getDaySpan(a.starts_at, a.ends_at, tz);
      var bDaySpan = getDaySpan(b.starts_at, b.ends_at, tz);
      if (aDaySpan !== bDaySpan) return aDaySpan > bDaySpan ? -1 : 1;
    }
    if (a.starts_at !== b.starts_at) return a.starts_at < b.starts_at ? -1 : 1;
    if (a.title !== b.title) return a.title < b.title ? -1 : 1;
    return 0;
  },

  handleTestFetch: function (er, res) {
    var parseDate = this.parseDate;
    this.update('events', {$set: _.reduce(res.data, function (events, event) {
      return events.concat(_.map(event.dates, function (date) {
        var isAllDay = event.is_all_day;
        return _.extend({
          id: date.id,
          title: event.title,
          description: event.description,
          location: event.location,
          filters: date.filters,
          is_all_day: isAllDay,
          starts_at: parseDate(date.starts_at, isAllDay),
          ends_at: parseDate(date.ends_at, isAllDay)
        });
      }));
    }, []).sort(this.comparator)});
  },

  handleTzChange: function (ev) {
    this.update('tz', {$set: ev.target.value});
  },

  handleQueryChange: function (ev) {
    this.update('query', {$set: ev.target.value});
  },

  render: function () {
    return (
      <div className='osw-events-index'>
        <select onChange={this.handleTzChange} value={this.state.tz}>
          <option>{this.props.tz}</option>
          <option>America/Los_Angeles</option>
          <option>America/New_York</option>
          <option>Europe/London</option>
          <option>Australia/Brisbane</option>
          <option>Asia/Hong_Kong</option>
          <option>Asia/Kolkata</option>
        </select>
        Search:
        <input value={this.state.query} onChange={this.handleQueryChange}/>
        <EventFiltersIndex
          cursors={{eventFilters: this.getCursor('filters')}}
        />
        <Calendar
          rows={6}
          cursors={{
            allEvents: this.getCursor('events'),
            events: this.getCursor('filteredEvents'),
            tz: this.getCursor('tz'),
            target: this.getCursor('target')
          }}
        />
      </div>
    );
  }
});
