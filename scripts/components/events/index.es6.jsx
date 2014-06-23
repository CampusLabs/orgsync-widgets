/** @jsx React.DOM */

import _ from 'underscore';
import api from 'api';
import Calendar from 'components/events/calendar';
import Cursors from 'cursors';
import moment from 'moment-timezone';
import React from 'react';
import tz from 'tz';

export default React.createClass({
  mixins: [Cursors],

  getDefaultProps: function () {
    return {
      tz: tz,
      target: moment().startOf('month').startOf('week').format('YYYY-MM-DD')
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

  comparator: function (a, b) {
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

  render: function () {
    return (
      <div className='osw-events-index'>
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
