/** @jsx React.DOM */

import _ from 'underscore';
import api from 'api';
import Cursors from 'cursors';
import EventFilterListItem from 'components/event-filters/list-item';
import React from 'react';
import tinycolor from 'tinycolor';

var RSVP_COLOR = '94b363';

export default React.createClass({
  mixins: [Cursors],

  getDefaultProps: function () {
    return {
      eventFilters: []
    };
  },

  getInitialState: function () {
    return {
      isLoading: false,
      error: null,
      eventFilters: this.props.eventFilters
    };
  },

  componentWillMount: function () {
    if (!this.state.eventFilters.length) this.fetch();
  },

  fetch: function () {
    this.update('isLoading', {$set: true});
    this.update('error', {$set: null});
    api.get(this.props.eventsUrl + '/filters', this.handleFetch);
  },

  handleFetch: function (er, res) {
    this.update('isLoading', {$set: false});
    if (er) return this.update('error', {$set: null});
    var getEventFilterColor = this.getEventFilterColor;
    var eventFilters = res.data;
    this.update('eventFilters', {
      $set: _.map(eventFilters, function (eventFilter, i) {
        return _.extend({}, eventFilter, {
          color: getEventFilterColor(eventFilter, i, eventFilters),
          active: true
        });
      })
    });
  },

  getEventFilterColor: function (filter, i, filters) {
    return filter.color || (
      filter.type === 'rsvp' ?
      RSVP_COLOR :
      tinycolor({h: i * (filters.length / 360), s: 1, l: 0.4}).toHex()
    );
  },

  renderEventFilter: function (eventFilter, i) {
    return (
      <EventFilterListItem
        key={eventFilter.id}
        cursors={{eventFilter: this.getCursor('eventFilters', i)}}
      />
    );
  },

  render: function () {
    return (
      <div className='osw-event-filters-index'>
        {_.map(this.state.eventFilters, this.renderEventFilter)}
      </div>
    );
  }
});
