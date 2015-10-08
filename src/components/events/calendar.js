import _ from 'underscore';
import {Mixin} from 'cursors';
import {fetch, getMoment} from 'entities/event';
import React from 'react';
import Week from 'components/events/week';

export default React.createClass({
  mixins: [Mixin],

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
    if (this.state.isLoading || this.state.error) return;
    this.update({isLoading: {$set: true}, error: {$set: null}});
    const options = {
      after: this.getStartMom().toISOString(),
      before: this.getEndMom().toISOString(),
      ranges: this.state.ranges,
      events: this.state.allEvents,
      url: this.props.eventsUrl
    };

    if (this.props.permissions.length) options.statuses = ['unpublished', 'published'];
    fetch(options, this.handleFetch);
  },

  handleFetch: function (er, ranges, events) {
    this.update({isLoading: {$set: false}});
    var deltas = {isLoading: {$set: false}};
    if (er) {
      deltas.error = {$set: er};
    } else if (ranges && events) {
      deltas.ranges = {$set: ranges};
      deltas.allEvents = {$set: events};
      if (this.isMounted()) _.defer(this.fetch);
    }
    this.update(deltas);
  },

  getStartMom: function () {
    return getMoment(this.props.date, this.props.tz)
      .startOf('month').startOf('week');
  },

  getEndMom: function () {
    return this.getStartMom().add(this.props.weeks, 'weeks');
  },

  getDates: function () {
    var startMom = this.getStartMom();
    return _.times(this.props.weeks, function (n) {
      return startMom.clone().add(n, 'weeks').format('YYYY-MM-DD');
    });
  },

  renderDayName: function (n) {
    return (
      <th key={n}>
        <div className='osw-events-calendar-day-name'>
          {getMoment(void 0, this.props.tz).day(n).format('ddd')}
        </div>
      </th>
    );
  },

  renderDayNames: function () {
    return (
      <table className='osw-events-calendar-day-names'>
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
        cursors={{allEvents: this.getCursor('allEvents')}}
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
