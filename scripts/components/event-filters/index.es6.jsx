/** @jsx React.DOM */

import _ from 'underscore';
import api from 'api';
import Cursors from 'cursors';
import EventFilterListItem from 'components/event-filters/list-item';
import React from 'react';
import tinycolor from 'tinycolor';
import velcroConfig from 'velcro-config';

var RSVP_HEX = '94b363';

var NOTHING_HEADER = '';
var CATEGORIES_HEADER = 'Categories';
var PORTALS_HEADER = 'Portals';

var SECTION_MAP = {
  category: CATEGORIES_HEADER,
  featured: NOTHING_HEADER,
  organization: PORTALS_HEADER,
  rsvp: NOTHING_HEADER,
  service_partner: PORTALS_HEADER,
  service_umbrella: PORTALS_HEADER,
  umbrella: PORTALS_HEADER
};

export default React.createClass({
  mixins: [Cursors],

  getDefaultProps: function () {
    return {
      activeIds: []
    };
  },

  getInitialState: function () {
    return {
      isLoading: true,
      error: null
    };
  },

  componentDidMount: function () {
    api.get(this.props.url, this.handleFetch);
  },

  componentDidUpdate: function (__, prevState) {
    if (this.state.events !== prevState.events) this.fillEventFilters();
  },

  handleFetch: function (er, res) {
    this.update({isLoading: {$set: false}});
    if (er) return this.update({error: {$set: er}});
    var activeIds = this.props.activeIds;
    this.fillEventFilters(_.map(res.data, function (eventFilter) {
      return _.extend({}, eventFilter, {
        active: !activeIds.length || _.contains(activeIds, eventFilter.id)
      });
    }));
  },

  fillEventFilters: function (eventFilters) {
    if (!eventFilters) eventFilters = this.state.eventFilters;
    var activeIds = this.props.activeIds;
    this.update({eventFilters: {$set: _.chain(this.state.events)
      .reduce(function (eventFilters, event) {
        var eventFilterIds = _.pluck(eventFilters, 'id');
        var inEventFilters = _.partial(_.include, event.filters);
        if (!_.any(eventFilterIds, inEventFilters)) {
          var id = _.find(event.filters, function (id) {
            return SECTION_MAP[id.split('-')[0]] === PORTALS_HEADER;
          });
          var type = id.split('-')[0];
          return eventFilters.concat({
            id: id,
            type: type,
            name: event.portal.name,
            active: !activeIds.length || _.contains(activeIds, id)
          });
        }
        return eventFilters;
      }, eventFilters)
      .sortBy('name')
      .each(this.setEventFilterHex)
      .value()
    }});
  },

  setEventFilterHex: function (filter, i, filters) {
    var color = _.find(velcroConfig.colors, {id: filter.color});
    filter.hex =
      color ?
      color.hex :
      filter.type === 'rsvp' ?
      RSVP_HEX :
      tinycolor({h: i * (360 / filters.length), s: 0.75, l: 0.55}).toHex();
  },

  toggle: function (eventFilters, ev) {
    this.update(_.reduce(eventFilters, function (deltas, eventFilter) {
      var i = _.indexOf(this.state.eventFilters, eventFilter);
      deltas.eventFilters[i] = {active: {$set: ev.target.checked}};
      return deltas;
    }, {eventFilters: {}}, this));
  },

  renderHeader: function (section) {
    if (!section.header) return;
    return (
      <label className=
        'osw-event-filters-list-item osw-event-filters-list-item-header'
      >
        <div className='osw-event-filters-list-item-name'>
          <input
            className='osw-event-filters-list-item-checkbox'
            type='checkbox'
            checked={_.every(section.eventFilters, 'active')}
            onChange={_.partial(this.toggle, section.eventFilters)}
          />
          {section.header}
        </div>
      </label>
    );
  },

  renderEventFilter: function (eventFilter) {
    var i = _.indexOf(this.state.eventFilters, eventFilter);
    return (
      <EventFilterListItem
        key={eventFilter.id}
        cursors={{eventFilter: this.getCursor('eventFilters', i)}}
      />
    );
  },

  renderSection: function (section, i) {
    return (
      <div key={i}>
        {i ? <hr /> : null}
        {this.renderHeader(section)}
        {_.map(section.eventFilters, this.renderEventFilter)}
      </div>
    );
  },

  renderSections: function () {
    var sections = _.chain(this.state.eventFilters)
      .groupBy(function (eventFilter) { return SECTION_MAP[eventFilter.type]; })
      .pairs()
      .map(_.partial(_.object, ['header', 'eventFilters']))
      .sortBy('header')
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
          <div>Loading...</div> :
          this.state.error ?
          <div>{this.state.error.toString()}</div> :
          this.renderSections()
        }
      </div>
    );
  }
});
