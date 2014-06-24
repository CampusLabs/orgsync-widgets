/** @jsx React.DOM */

import _ from 'underscore';
import api from 'api';
import Calendar from 'components/events/calendar';
import Cursors from 'cursors';
import mom from 'mom';
import React from 'react';
import tz from 'tz';

export default React.createClass({
  mixins: [Cursors],

  getDefaultProps: function () {
    return {
      tz: tz,
      target: mom(void 0, tz)
        .startOf('month')
        .startOf('week')
        .format('YYYY-MM-DD')
    };
  },

  getInitialState: function () {
    return {
      events: [],
      tz: this.props.tz,
      target: this.props.target
    };
  },

  componentWillMount: function () {
    this.testFetch();
  },

  testFetch: function () {
    api.get('/accounts/events', {
      upcoming: true,
      per_page: 100,
      after: this.props.target
    }, this.handleTestFetch);
  },

  parseDate: function (date, isAllDay) {
    return isAllDay ? date.slice(0, 10) : (new Date(date)).toISOString();
  },

  getDaySpan: function (event) {
    var tz = this.state.tz;
    return Math.ceil(mom(event.ends_at, tz).diff(mom(event.starts_at, tz)));
  },

  comparator: function (a, b) {
    var aDaySpan = this.getDaySpan(a);
    var bDaySpan = this.getDaySpan(b);
    if (aDaySpan !== bDaySpan) return aDaySpan > bDaySpan ? -1 : 1;
    if (a.is_all_day !== b.is_all_day) return a.is_all_day ? -1 : 1;
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
          title: event.title,
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

  render: function () {
    return (
      <div className='osw-events-index'>
        <select onChange={this.handleTzChange} value={this.state.tz}>
          <option>{tz}</option>
          <option>America/Los_Angeles</option>
          <option>America/New_York</option>
          <option>Europe/London</option>
          <option>Australia/Brisbane</option>
          <option>Asia/Hong_Kong</option>
        </select>
        <Calendar
          rows={6}
          cursors={{
            events: this.getCursor('events'),
            tz: this.getCursor('tz'),
            target: this.getCursor('target')
          }}
        />
      </div>
    );
  }
});
