/** @jsx React.DOM */

import _ from 'underscore';
import api from 'api';
import Cursors from 'cursors';
import {mom} from 'entities/event';
import List from 'react-list';
import ListItem from 'components/events/list-item';
import React from 'react';

var PREFIX_RE = /^(Yesterday|Today|Tomorrow)/;

export default React.createClass({
  mixins: [Cursors],

  getDates: function () {
    var tz = this.props.tz;
    var now = mom(void 0, tz);
    var past = this.props.past;
    var dir = past ? -1 : 1;
    return _.chain(this.props.events)
      .reduce(function (dates, event) {
        var start = mom(event.starts_at, tz);
        var end = mom(event.ends_at, tz);
        if (!past && start < now) start = now.clone();
        if (past && end > now) end = now.clone();
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
    var dateMom = mom(date, this.props.tz);
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
      />
    );
  }
});
