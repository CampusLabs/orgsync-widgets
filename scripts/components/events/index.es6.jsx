/** @jsx React.DOM */

import _ from 'underscore';
import Calendar from 'components/events/calendar';
import List from 'components/events/list';
import Cursors from 'cursors';
import EventFiltersIndex from 'components/event-filters/index';
import Icon from 'components/icon';
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
      view: VIEWS[0],
      filtersAreShowing: true,
      date: getMoment(void 0, tz).format('YYYY-MM-DD')
    };
  },

  getInitialState: function () {
    return {
      events: this.props.events,
      query: this.props.query,
      eventFilters: this.props.eventFilters,
      tz: this.props.tz,
      view: this.props.view,
      ranges: [],
      filtersAreShowing: this.props.filtersAreShowing,
      date: getMoment(this.props.date, this.props.tz).format('YYYY-MM-DD')
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

  getMainClassName: function () {
    var classes = ['osw-events-index-main'];
    if (!this.state.filtersAreShowing) {
      classes.push('osw-events-index-full-width');
    }
    return classes.join(' ');
  },

  handleTzChange: function (ev) {
    this.update('tz', {$set: ev.target.value});
  },

  handleQueryChange: function (ev) {
    this.update('query', {$set: ev.target.value});
  },

  toggleFiltersAreShowing: function () {
    this.update('filtersAreShowing', {$set: !this.state.filtersAreShowing});
  },

  renderTz: function () {
    var tz = this.state.tz;
    var city = tz.replace(/^.*?\//, '').replace(/_/g, ' ');
    return (
      <div className='osw-events-index-tz'>
        {city + ' Time (' + getMoment(void 0, tz).zoneAbbr() + ')'}
      </div>
    );
  },

  handleMonthChange: function (ev) {
    var month = parseInt(ev.target.value);
    var dateMom = getMoment(this.state.date, this.state.tz).month(month);
    this.update('date', {$set: dateMom.format('YYYY-MM-DD')});
  },

  handleYearChange: function (ev) {
    var year = parseInt(ev.target.value);
    var dateMom = getMoment(this.state.date, this.state.tz).year(year);
    this.update('date', {$set: dateMom.format('YYYY-MM-DD')});
  },

  handleTodayClick: function () {
    var dateMom = getMoment(void 0, this.state.tz);
    this.update('date', {$set: dateMom.format('YYYY-MM-DD')});
  },

  handlePrevClick: function () {
    this.incrMonth(-1);
  },

  handleNextClick: function () {
    this.incrMonth(1);
  },

  incrMonth: function (dir) {
    var dateMom = getMoment(this.state.date, this.state.tz).add('month', dir);
    this.update('date', {$set: dateMom.format('YYYY-MM-DD')});
  },

  renderMonthOption: function (month) {
    return (
      <option key={month} value={month}>
        {getMoment(this.state.date, this.state.tz).month(month).format('MMMM')}
      </option>
    );
  },

  renderMonthSelect: function () {
    return (
      <select
        className='osw-events-index-month'
        value={getMoment(this.state.date, this.state.tz).month()}
        onChange={this.handleMonthChange}
      >
        {_.times(12, this.renderMonthOption)}
      </select>
    );
  },

  renderYearOption: function (year) {
    return <option key={year}>{year}</option>;
  },

  renderYearSelect: function () {
    var year = getMoment(this.state.date, this.state.tz).year();
    return (
      <select
        className='osw-events-index-year'
        value={year}
        onChange={this.handleYearChange}
      >
        {_.map(_.range(year - 3, year + 4), this.renderYearOption)}
      </select>
    );
  },

  renderCalendarControls: function () {
    return (
      <div className='osw-events-index-calendar-controls'>
        <span className='osw-events-index-incr'>
          <span
            className='osw-button osw-events-tab'
            onClick={this.handlePrevClick}
          >
            <Icon
              name='pointer-left'
              className='osw-events-index-prev-month'
            />
          </span>
          <span
            className='osw-events-tab osw-events-index-today-month osw-button'
            onClick={this.handleTodayClick}
          >
            Today
          </span>
          <span
            className='osw-button osw-events-tab'
            onClick={this.handleNextClick}
          >
            <Icon
              name='pointer-right'
              className='osw-events-index-next-month'
            />
          </span>
        </span>
        {this.renderMonthSelect()}
        {this.renderYearSelect()}
      </div>
    );
  },

  renderListControls: function () {
    var view = this.state.view;
    return (
      <div className='osw-events-index-list-controls'>
        <Tab
          view='upcoming'
          selected={view === 'upcoming'}
          cursors={{currentView: this.getCursor('view')}}
        />
        <Tab
          view='past'
          selected={view === 'past'}
          cursors={{currentView: this.getCursor('view')}}
        />
      </div>
    );
  },

  renderViewControls: function () {
    return this.state.view === 'calendar' ?
      this.renderCalendarControls() :
      this.renderListControls();
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
          date={this.state.date}
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
    var view = this.state.view;
    return (
      <div className='osw-events-index'>
        <div className='osw-events-index-sidebar'>
          <div className='osw-events-index-search'>
            <div className='osw-field oswi oswi-magnify'>
              <input
                value={this.state.query}
                onChange={this.handleQueryChange}
              />
            </div>
          </div>
          <EventFiltersIndex
            url={this.getEventsUrl() + '/filters'}
            header={this.props.eventFiltersHeader}
            cursors={{eventFilters: this.getCursor('eventFilters')}}
          />
        </div>
        <div className={this.getMainClassName()}>
          <div className='osw-events-index-header'>
            {this.renderTz()}
            <div className='osw-events-index-left'>
              <span
                className='osw-button osw-events-index-toggle-filters'
                onClick={this.toggleFiltersAreShowing}
              >
                <Icon name='office-shortcuts' />{' '}
                {this.state.filtersAreShowing ? 'Hide Filters' : 'Show Filters'}
              </span>
              <span className='osw-events-index-view-tabs'>
                <Tab
                  name='Calendar'
                  view='calendar'
                  selected={view === 'calendar'}
                  cursors={{currentView: this.getCursor('view')}}
                />
                <Tab
                  name='List'
                  view='upcoming'
                  selected={view === 'upcoming' || view === 'past'}
                  cursors={{currentView: this.getCursor('view')}}
                />
              </span>
            </div>
            {this.renderViewControls()}
          </div>
          <div className='osw-events-index-view'>{this.renderView()}</div>
        </div>
      </div>
    );
  }
});
