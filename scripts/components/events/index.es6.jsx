/** @jsx React.DOM */

import _ from 'underscore';
import Calendar from 'components/events/calendar';
import List from 'components/events/list';
import Cursors from 'cursors';
import EventFiltersIndex from 'components/event-filters/index';
import moment from 'moment';
import React from 'react';
import Tab from 'components/events/tab';
import tz from 'tz';

import {
  comparator,
  getMoment,
  getDaySpan,
  matchesQueryAndFilters
} from 'entities/event';

var VIEWS = ['calendar', 'upcoming', 'past'];

export default React.createClass({
  mixins: [Cursors],

  getDefaultProps: function () {
    return {
      events: [],
      query: '',
      eventFilters: [],
      tz: tz,
      view: VIEWS[0]
    };
  },

  getInitialState: function () {
    return {
      events: this.props.events,
      query: this.props.query,
      eventFilters: this.props.eventFilters,
      tz: this.props.tz,
      view: this.props.view,
      ranges: []
    };
  },

  getFilteredEvents: function () {
    var events = this.state.events;
    var query = this.state.query;
    var filters = this.getActiveEventFilters();
    var matches = _.partial(matchesQueryAndFilters, _, query, filters);
    return _.filter(events, matches).sort(_.partial(comparator, tz));
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

  handleTzChange: function (ev) {
    this.update('tz', {$set: ev.target.value});
  },

  handleQueryChange: function (ev) {
    this.update('query', {$set: ev.target.value});
  },

  renderTz: function () {
    var tz = this.state.tz;
    var city = tz.replace(/^.*?\//, '').replace(/_/g, ' ');
    return city + ' Time (' + getMoment(void 0, tz).zoneAbbr() + ')';
  },

  renderTab: function (view) {
    return (
      <Tab
        key={view}
        view={view}
        cursors={{currentView: this.getCursor('view')}}
      />
    );
  },

  renderTabs: function () {
    return <div className='osw-view-tabs'>{_.map(VIEWS, this.renderTab)}</div>;
  },

  renderView: function () {
    switch (this.state.view) {
    case 'calendar':
      return (
        <Calendar
          key='calendar'
          weeks={6}
          events={this.getFilteredEvents()}
          eventFilters={this.getActiveEventFilters()}
          eventsUrl={this.getEventsUrl()}
          tz={this.state.tz}
          date={this.props.date}
          cursors={{
            allEvents: this.getCursor('events'),
            ranges: this.getCursor('ranges')
          }}
        />
      );
    case 'upcoming':
      return (
        <List
          key='upcoming'
          events={this.getFilteredEvents()}
          eventFilters={this.getActiveEventFilters()}
          eventsUrl={this.getEventsUrl()}
          tz={this.state.tz}
          cursors={{
            allEvents: this.getCursor('events'),
            ranges: this.getCursor('ranges')
          }}
        />
      );
    case 'past':
      return (
        <List
          key='past'
          events={this.getFilteredEvents()}
          eventFilters={this.getActiveEventFilters()}
          eventsUrl={this.getEventsUrl()}
          tz={this.state.tz}
          past={true}
          cursors={{
            allEvents: this.getCursor('events'),
            ranges: this.getCursor('ranges')
          }}
        />
      );
    }
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
        {this.renderTabs()}
        {this.renderView()}
      </div>
    );
  }
});
