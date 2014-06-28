/** @jsx React.DOM */

import _ from 'underscore';
import api from 'api';
import Cursors from 'cursors';
import List from 'react-list';
import ListItem from 'components/events/list-item';
import React from 'react';

import {
  fetch,
  getMoment,
  getNextContiguous,
  getPrevContiguous
} from 'entities/event';

var PREFIX_RE = /^(Yesterday|Today|Tomorrow)/;

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

  renderEvent: function (date, event) {
    return (
      <ListItem
        key={event.id}
        date={date}
        event={event}
        eventFilters={this.props.eventFilters}
        tz={this.props.tz}
      />
    );
  },

  renderDate: function (date) {
    var events = date[1];
    date = date[0];
    var dateMom = getMoment(date, this.props.tz);
    var prefix = PREFIX_RE.exec(dateMom.calendar()) || '';
    if (prefix) prefix = prefix[0] + ', ';
    return (
      <div key={date}>
        <div className='osw-events-list-date'>
          {prefix + dateMom.format('dddd, MMMM D, YYYY')}
        </div>
        <List
          items={events}
          renderItem={_.partial(this.renderEvent, date)}
          uniform={true}
        />
      </div>
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
