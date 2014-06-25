/** @jsx React.DOM */

import _ from 'underscore';
import api from 'api';
import Cursors from 'cursors';
import {mom} from 'entities/event';
import List from 'react-list';
import ListItem from 'components/events/list-item';
import React from 'react';

export default React.createClass({
  mixins: [Cursors],

  getDefaultProps: function () {
    return {
      events: []
    };
  },

  getInitialState: function () {
    return {
      events: this.props.events
    };
  },

  getDates: function () {
    var tz = this.state.tz;
    var now = mom(void 0, this.state.tz);
    return _.chain(this.state.events)
      .reduce(function (dates, event) {
        var start = mom(event.starts_at, tz);
        var end = mom(event.ends_at, tz);
        var cursor = (now < start ? start : now).clone();
        while (cursor < end) {
          var key = cursor.format('YYYY-MM-DD');
          if (!dates[key]) dates[key] = [];
          dates[key].push(event);
          cursor.add('day', 1).startOf('day');
        }
        return dates;
      }, {})
      .pairs()
      .sortBy(0)
      .value();
  },

  renderEvent: function (date, event) {
    var i = _.indexOf(this.state.allEvents, event);
    return (
      <ListItem
        key={event.id}
        date={date}
        cursors={{
          event: this.getCursor('allEvents', i),
          tz: this.getCursor('tz')
        }}
      />
    );
  },

  renderDate: function (date) {
    var events = date[1];
    date = date[0];
    return (
      <div key={date} className='osw-events-list-date'>
        <div>{date}</div>
        <List
          className='osw-events-list'
          items={events}
          renderItem={_.partial(this.renderEvent, date)}
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
