import _ from 'underscore';
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

var YEAR_LIMIT = 2;

export default React.createClass({
  mixins: [Cursors],

  fetch: function (cb) {
    var options = {
      ranges: this.state.ranges,
      events: this.state.allEvents,
      url: this.props.eventsUrl
    };
    var past = this.props.past;
    var now = getMoment(void 0, this.props.tz);
    options[past ? 'before' : 'after'] = now.toISOString();
    options[past ? 'after' : 'before'] =
      now.add((past ? -1 : 1) * YEAR_LIMIT, 'years').toISOString();
    if (past) options.direction = 'backwards';
    fetch(options, _.partial(this.handleFetch, cb));
  },

  handleFetch: function (cb, er, ranges, events) {
    if (er) return cb(er);
    if (!ranges || !events) return cb(null, true);
    this.update({ranges: {$set: ranges}, allEvents: {$set: events}});
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
          start.add(1, 'day').startOf('day');
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
        redirect={this.props.redirect}
        portalId={this.props.portalId}
        tz={this.props.tz}
        cursors={{allEvents: this.getCursor('allEvents')}}
      />
    );
  },

  renderLoading: function () {
    return <div className='osw-inset-block'>Loading...</div>;
  },

  renderEmpty: function () {
    return <div className='osw-blank-slate-message'>There are no events to show.</div>;
  },

  render: function () {
    return (
      <List
        className='osw-events-list'
        items={this.getDates()}
        renderItem={this.renderDate}
        renderLoading={this.renderLoading}
        renderEmpty={this.renderEmpty}
        fetch={this.fetch}
        fetchInitially={true}
      />
    );
  }
});
