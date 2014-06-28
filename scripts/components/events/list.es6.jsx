/** @jsx React.DOM */

import _ from 'underscore';
import api from 'api';
import Cursors from 'cursors';
import List from 'react-list';
import ListDate from 'components/events/list-date';
import React from 'react';

import {
  fetch,
  getMoment,
  getNextContiguous,
  getPrevContiguous
} from 'entities/event';

export default React.createClass({
  mixins: [Cursors],

  fetch: function (cb) {
    var options = {
      ranges: this.state.ranges,
      events: this.state.allEvents,
      url: this.props.eventsUrl
    };
    var iso = getMoment(void 0, this.props.tz).toISOString();
    options[this.props.past ? 'before' : 'after'] = iso;
    fetch(options, _.partial(this.handleFetch, cb));
  },

  handleFetch: function (cb, er, ranges, events) {
    if (er) return cb(er);
    if (!ranges || !events) return cb(null, true);
    this.update('ranges', {$set: ranges});
    this.update('allEvents', {$set: events});
    cb();
  },

  getDates: function () {
    var tz = this.props.tz;
    var now = getMoment(void 0, tz);
    var past = this.props.past;
    var dir = past ? -1 : 1;
    var ranges = this.state.ranges;
    var method = past ? getPrevContiguous : getNextContiguous;
    var contiguousLimit = getMoment(method(now.toISOString(), ranges), tz);
    return _.chain(this.props.events)
      .reduce(function (dates, event) {
        var start = getMoment(event.starts_at, tz);
        var end = getMoment(event.ends_at, tz);
        if (past) {
          if (end < contiguousLimit) return dates;
          if (end > now) end = now.clone();
        } else {
          if (start > contiguousLimit) return dates;
          if (start < now) start = now.clone();
        }
        while (start < end) {
          var key = start.format('YYYY-MM-DD');
          if (!dates[key]) dates[key] = [];
          dates[key].push(event);
          start.add('day', 1).startOf('day');
        }
        return dates;
      }, {})
      .pairs()
      .value()
      .sort(function (a, b) { return dir * (a[0] < b[0] ? -1 : 1); });
  },

  renderDate: function (date) {
    return (
      <ListDate
        key={date[0]}
        date={date[0]}
        events={date[1]}
        eventFilters={this.props.eventFilters}
        tz={this.props.tz}
      />
    );
  },

  render: function () {
    return (
      <List
        className='osw-events-list'
        items={this.getDates()}
        renderItem={this.renderDate}
        fetch={this.fetch}
      />
    );
  }
});
