import _ from 'underscore';
import Button from 'components/ui/button';
import ButtonGroup from 'components/ui/button-group';
import Calendar from 'components/events/calendar';
import List from 'components/events/list';
import Cursors from 'cursors';
import EventFiltersIndex from 'components/event-filters/index';
import Icon from 'components/ui/icon';
import React from 'react';
import tz from 'tz';

import {
  comparator,
  getMoment,
  matchesQueryAndFilters
} from 'entities/event';

var LIST_LOCK_BREAKPOINT = 600;

export default React.createClass({
  mixins: [Cursors],

  getDefaultProps: function () {
    return {
      activeEventFilterIds: [],
      date: getMoment(void 0, tz).format('YYYY-MM-DD'),
      eventFilters: [],
      events: [],
      filtersAreShowing: true,
      lockView: false,
      query: '',
      tz: tz,
      view: 'calendar',
      isAdmin: false
    };
  },

  getInitialState: function () {
    return {
      date: getMoment(this.props.date, this.props.tz).format('YYYY-MM-DD'),
      eventFilters: this.props.eventFilters,
      events: this.props.events,
      filtersAreShowing: this.props.filtersAreShowing,
      query: this.props.query,
      ranges: [],
      tz: this.props.tz,
      view: this.props.view,
      width: Infinity
    };
  },

  componentDidMount: function () {
    this.setWidth();
    window.addEventListener('resize', this.setWidth);
  },

  componentWillUnmount: function () {
    window.removeEventListener('resize', this.setWidth);
  },

  setWidth: function () {
    var rect = this.getDOMNode().getBoundingClientRect();
    this.update({width: {$set: rect.width}});
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
    if (!this.state.filtersAreShowing || this.isListLocked()) {
      classes.push('osw-events-index-full-width');
    }
    return classes.join(' ');
  },

  handleTzChange: function (ev) {
    this.update({tz: {$set: ev.target.value}});
  },

  handleQueryChange: function (ev) {
    this.update({query: {$set: ev.target.value}});
  },

  toggleFiltersAreShowing: function () {
    this.update({filtersAreShowing: {$set: !this.state.filtersAreShowing}});
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
    this.update({date: {$set: dateMom.format('YYYY-MM-DD')}});
  },

  handleYearChange: function (ev) {
    var year = parseInt(ev.target.value);
    var dateMom = getMoment(this.state.date, this.state.tz).year(year);
    this.update({date: {$set: dateMom.format('YYYY-MM-DD')}});
  },

  handleTodayClick: function () {
    var dateMom = getMoment(void 0, this.state.tz);
    this.update({date: {$set: dateMom.format('YYYY-MM-DD')}});
  },

  handlePrevClick: function () {
    this.incrMonth(-1);
  },

  handleNextClick: function () {
    this.incrMonth(1);
  },

  incrMonth: function (dir) {
    var dateMom = getMoment(this.state.date, this.state.tz).add(dir, 'month');
    this.update({date: {$set: dateMom.format('YYYY-MM-DD')}});
  },

  isListLocked: function () {
    return this.state.width < LIST_LOCK_BREAKPOINT;
  },

  getView: function () {
    var view = this.state.view;
    return this.isListLocked() && view === 'calendar' ? 'upcoming' : view;
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

  renderFiltersToggle: function () {
    if (this.isListLocked()) return;
    return (
      <Button
        className='osw-events-index-toggle-filters'
        onClick={this.toggleFiltersAreShowing}
      >
        <Icon name='office-shortcuts' />{' '}
        {this.state.filtersAreShowing ? 'Hide Filters' : 'Show Filters'}
      </Button>
    );
  },

  renderCalendarControls: function () {
    return (
      <div className='osw-events-index-calendar-controls'>
        <ButtonGroup className='osw-events-index-incr'>
          <Button onClick={this.handlePrevClick}>
            <Icon
              name='pointer-left'
              className='osw-events-index-prev-month'
            />
          </Button>
          <Button onClick={this.handleTodayClick}>Today</Button>
          <Button onClick={this.handleNextClick}>
            <Icon
              name='pointer-right'
              className='osw-events-index-next-month'
            />
          </Button>
        </ButtonGroup>
        {this.renderMonthSelect()}
        {this.renderYearSelect()}
      </div>
    );
  },

  renderListControls: function () {
    var view = this.getView();
    return (
      <ButtonGroup className='osw-events-index-list-controls'>
        <Button
          isSelected={view === 'upcoming'}
          onClick={_.partial(this.update, {view: {$set: 'upcoming'}})}
        >
          Upcoming
        </Button>
        <Button
          isSelected={view === 'past'}
          onClick={_.partial(this.update, {view: {$set: 'past'}})}
        >
          Past
        </Button>
      </ButtonGroup>
    );
  },

  renderViewTabs: function () {
    if (this.props.lockView || this.isListLocked()) return;
    var view = this.getView();
    return (
      <ButtonGroup className='osw-events-index-view-tabs'>
        <Button
          isSelected={view === 'calendar'}
          onClick={_.partial(this.update, {view: {$set: 'calendar'}})}
        >
          Calendar
        </Button>
        <Button
          isSelected={view === 'upcoming' || view === 'past'}
          onClick={_.partial(this.update, {view: {$set: 'upcoming'}})}
        >
          List
        </Button>
      </ButtonGroup>
    );
  },

  renderViewControls: function () {
    return this.getView() === 'calendar' ?
      this.renderCalendarControls() :
      this.renderListControls();
  },

  renderView: function () {
    switch (this.getView()) {
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

  renderOSAdminButtons: function () {
    if (!this.props.isAdmin) return;
    var baseURL = '/' + this.props.portalId;

    return (
      <div className='button-group admin-button-group'>
        <a href='{baseURL}/events/show_grid' className='hide-for-small-only'>
          <i className='icon-involvement'></i>Attendance
        </a>
        <a href='{baseURL}/events/forms' className='hide-for-small-only'>
          <i className='icon-forms'></i>Event Forms
        </a>
        <div class="has-dropdown click-dropdown">
          <a href="#" class="button share-button has-icon">
            <i class=" icon-down"></i>Export
          </a>
          <div class="dropdown dropdown-left">
            <ul class="button-list">
              <li>
                <a href="{baseURL}/admin_reports/export_turnout?export=hours"
                    className="js-no-pjax icon-download"
                    data-export-queue="true">Event Hours</a>
              </li>
              <li>
                <a href="{baseURL}/admin_reports/export_turnout?export=attendance"
                    className="js-no-pjax icon-download"
                    data-export-queue="true">Attendance</a>
              </li>
              <li>
                <a href="{baseURL}/events/export_all_event_members"
                    className="js-no-pjax icon-download"
                    data-export-queue="true">RSVPs</a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    )
  },

  render: function () {
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
            activeIds={this.props.activeEventFilterIds}
            useSharedHeader={!!this.props.portalId}
            cursors={{
              events: this.getCursor('events'),
              eventFilters: this.getCursor('eventFilters')
            }}
          />
          {this.renderOSAdminButtons()}
        </div>
        <div className={this.getMainClassName()}>
          <div className='osw-events-index-header'>
            <div className='osw-events-index-left'>
              {this.renderFiltersToggle()}
              {this.renderViewTabs()}
            </div>
            {this.renderViewControls()}
          </div>
          <div className='osw-events-index-view'>{this.renderView()}</div>
          {this.renderTz()}
        </div>
      </div>
    );
  }
});
