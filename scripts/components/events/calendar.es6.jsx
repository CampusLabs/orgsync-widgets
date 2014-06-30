/** @jsx React.DOM */

import _ from 'underscore';
import api from 'api';
import Cursors from 'cursors';
import moment from 'moment'
import {fetch, getMoment, getDaySpan} from 'entities/event';
import React from 'react';
import tz from 'tz';
import Week from 'components/events/week';

export default React.createClass({
  mixins: [Cursors],

  getInitialState: function () {
    return {
      isLoading: false,
      error: null
    };
  },

  componentDidMount: function () {
    this.fetch();
  },

  componentDidUpdate: function (prevProps) {
    if (this.props.date !== prevProps.date) this.fetch();
  },

  fetch: function () {
    if (this.state.isLoading) return;
    this.update('isLoading', {$set: true});
    fetch({
      after: this.getStartMom().toISOString(),
      before: this.getEndMom().toISOString(),
      ranges: this.state.ranges,
      events: this.state.allEvents,
      url: this.props.eventsUrl
    }, this.handleFetch)
  },

  handleFetch: function (er, ranges, events) {
    if (!this.isMounted()) return;
    this.update('isLoading', {$set: false});
    if (er) {
      this.update('error', {$set: er});
    } else if (ranges && events) {
      this.update('ranges', {$set: ranges});
      this.update('allEvents', {$set: events});
      this.fetch();
    }
  },

  getStartMom: function () {
    return getMoment(this.props.date, this.props.tz)
      .startOf('month').startOf('week');
  },

  getEndMom: function () {
    return this.getStartMom().add('weeks', this.props.weeks);
  },

  getDates: function () {
    var startMom = this.getStartMom();
    return _.times(this.props.weeks, function (n) {
      return startMom.clone().add('weeks', n).format('YYYY-MM-DD');
    });
  },

  renderDayName: function (n) {
    return (
      <th key={n}>
        <div className='osw-day-name'>
          {getMoment(void 0, this.props.tz).day(n).format('ddd')}
        </div>
      </th>
    );
  },

  renderDayNames: function () {
    return (
      <table className='osw-day-names'>
        <thead>
          <tr>{_.times(7, this.renderDayName)}</tr>
        </thead>
      </table>
    );
  },

  renderWeek: function (date) {
    return (
      <Week
        key={date}
        date={date}
        rows={4}
        events={this.props.events}
        eventFilters={this.props.eventFilters}
        tz={this.props.tz}
      />
    );
  },

  render: function () {
    return (
      <div className='osw-events-calendar'>
        {this.renderDayNames()}
        {this.getDates().map(this.renderWeek)}
      </div>
    );
  }
});
