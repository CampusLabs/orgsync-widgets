/** @jsx React.DOM */

import _ from 'underscore';
import api from 'api';
import Cursors from 'cursors';
import EventFilterListItem from 'components/event-filters/list-item';
import React from 'react';
import tinycolor from 'tinycolor';
import velcroConfig from 'velcro-config';

var update = React.addons.update;

var RSVP_COLOR = '94b363';

export default React.createClass({
  mixins: [Cursors],

  getDefaultProps: function () {
    return {
      eventFilters: [],
      header: 'Filters'
    };
  },

  getInitialState: function () {
    return {
      isLoading: false,
      error: null,
      eventFilters: this.props.eventFilters
    };
  },

  componentDidMount: function () {
    if (!this.state.eventFilters.length) this.fetch();
  },

  fetch: function () {
    this.update({isLoading: {$set: true}, error: {$set: null}});
    api.get(this.props.url, this.handleFetch);
  },

  handleFetch: function (er, res) {
    this.update({isLoading: {$set: false}});
    if (er) return this.update({error: {$set: er}});
    var getEventFilterColor = this.getEventFilterColor;
    var eventFilters = res.data.slice().sort(this.comparator);
    this.update({eventFilters: {
      $set: _.map(eventFilters, function (eventFilter, i) {
        return _.extend({}, eventFilter, {
          color: getEventFilterColor(eventFilter, i, eventFilters),
          active: true
        });
      })
    }});
  },

  comparator: function (a, b) {
    if (a.type !== b.type) {
      if (a.type === 'rsvp') return -1;
      if (b.type === 'rsvp') return 1;
      if (a.type === 'featured') return -1;
      if (b.type === 'featured') return 1;
    }
    if (a.name !== b.name) return a.name < b.name ? -1 : 1;
    return 0;
  },

  getEventFilterColor: function (filter, i, filters) {
    var color = _.find(velcroConfig.colors, {id: filter.color});
    return color ? color.hex : (
      filter.type === 'rsvp' ?
      RSVP_COLOR :
      tinycolor({h: i * (360 / filters.length), s: 1, l: 0.4}).toHex()
    );
  },

  handleChange: function (section, ev) {
    var eventFilters = this.state.eventFilters;
    this.update(_.reduce(section, function (deltas, eventFilter) {
      var i = _.indexOf(eventFilters, eventFilter);
      deltas.eventFilters[i] = {active: {$set: ev.target.checked}};
      return deltas;
    }, {eventFilters: {}}));
  },

  renderHeader: function (section) {
    return (
      <div className='osw-event-filters-list-item osw-header'>
        <label>
          <div className='osw-name'>
            <input
              type='checkbox'
              checked={_.every(section, 'active')}
              onChange={_.partial(this.handleChange, section)}
            />
            {this.props.header}
          </div>
        </label>
      </div>
    );
  },

  renderEventFilter: function (eventFilter) {
    var i = _.indexOf(this.state.eventFilters, eventFilter);
    return (
      <EventFilterListItem
        key={eventFilter.id}
        header={this.props.header}
        cursors={{eventFilter: this.getCursor('eventFilters', i)}}
      />
    );
  },

  renderSection: function (section, i, sections) {
    return (
      <div key={i}>
        {i ? <hr /> : null}
        {i === sections.length - 1 ? this.renderHeader(section) : null}
        {_.map(section, this.renderEventFilter)}
      </div>
    );
  },

  renderSections: function () {
    var sections = _.chain(this.state.eventFilters)
      .partition(function (eventFilter) {
        return eventFilter.type === 'rsvp' || eventFilter.type === 'featured';
      })
      .filter('length')
      .value();
    return (
      <div className='osw-event-filters'>
        {_.map(sections, this.renderSection)}
      </div>
    );
  },

  render: function () {
    return (
      <div className='osw-inset-block osw-event-filters-index'>
        {
          this.state.isLoading ?
          <div className='osw-loading'>Loading...</div> :
          this.state.error ?
          <div className='osw-error'>{this.state.error}</div> :
          this.renderSections()
        }
      </div>
    );
  }
});
