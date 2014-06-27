/** @jsx React.DOM */

import _ from 'underscore';
import api from 'api';
import Calendar from 'components/events/calendar';
import List from 'components/events/list';
import Cursors from 'cursors';
import EventFiltersIndex from 'components/event-filters/index';
import moment from 'moment';
import {mom, getDaySpan, matchesQueryAndFilters} from 'entities/event';
import React from 'react';
import tz from 'tz';

export default React.createClass({
  mixins: [Cursors],

  getDefaultProps: function () {
    return {
      events: [],
      query: '',
      eventFilters: [],
      tz: tz
    };
  },

  getInitialState: function () {
    return {
      events: this.props.events,
      query: this.props.query,
      eventFilters: this.props.eventFilters,
      tz: this.props.tz
    };
  },

  componentDidMount: function () {
    this.testFetch();
  },

  getFilteredEvents: function () {
    var events = this.state.events;
    var query = this.state.query;
    var filters = this.getActiveEventFilters();
    var matches = _.partial(matchesQueryAndFilters, _, query, filters);
    return _.filter(events, matches);
  },

  getEventsUrl: function () {
    return (
      this.props.communityId ? '/communities/' + this.props.communityId :
      this.props.portalId ? '/portals/' + this.props.portalId :
      '/accounts'
    ) + '/events';
  },

  getActiveEventFilters: function () {
    return _.filter(this.state.eventFilters, _.matches({active: true}));
  },

  testFetch: function () {
    api.get(this.getEventsUrl(), {
      upcoming: true,
      per_page: 100,
      after: mom(void 0, this.state.tz)
        .startOf('month').startOf('week').toISOString()
    }, this.handleTestFetch);
  },

  parseDate: function (date, isAllDay) {
    return isAllDay ? date.slice(0, 10) : moment.utc(date).toISOString();
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
        return _.extend({}, event, date, {
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

  renderTz: function () {
    var tz = this.state.tz;
    var city = tz.replace(/^.*?\//, '').replace(/_/g, ' ');
    return city + ' Time (' + mom(void 0, tz).zoneAbbr() + ')';
  },

  render: function () {
    return (
      <div className='osw-events-index'>
        <div className='osw-field oswi oswi-magnify'>
          <input value={this.state.query} onChange={this.handleQueryChange}/>
        </div>
        {this.renderTz()}
        <select onChange={this.handleTzChange} value={this.state.tz}>
          <option>{this.props.tz}</option>
          <option>America/Los_Angeles</option>
          <option>America/New_York</option>
          <option>Europe/London</option>
          <option>Australia/Brisbane</option>
          <option>Asia/Hong_Kong</option>
          <option>Asia/Kolkata</option>
        </select>
        <EventFiltersIndex
          url={this.getEventsUrl() + '/filters'}
          header={this.props.eventFiltersHeader}
          cursors={{eventFilters: this.getCursor('eventFilters')}}
        />
        <Calendar
          rows={6}
          events={this.getFilteredEvents()}
          eventFilters={this.getActiveEventFilters()}
          tz={this.state.tz}
          date={this.props.date}
        />
        <h1>UPCOMING</h1>
        <List
          events={this.getFilteredEvents()}
          eventFilters={this.getActiveEventFilters()}
          tz={this.state.tz}
        />
        <h1>PAST</h1>
        <List
          events={this.getFilteredEvents()}
          eventFilters={this.getActiveEventFilters()}
          tz={this.state.tz}
          past={true}
        />
      </div>
    );
  }
});
