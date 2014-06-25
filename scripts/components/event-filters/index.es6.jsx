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
    api.get(this.props.url, this.handleFetch);
  },

  handleFetch: function (er, res) {
    this.update('isLoading', {$set: false});
    if (er) return this.update('error', {$set: null});
    var getEventFilterColor = this.getEventFilterColor;
    var eventFilters = res.data.slice().sort(this.comparator);
    this.update('eventFilters', {
      $set: _.map(eventFilters, function (eventFilter, i) {
        return _.extend({}, eventFilter, {
          color: getEventFilterColor(eventFilter, i, eventFilters),
          active: true
        });
      })
    });
  },

  comparator: function (a, b) {
    if (a.type !== b.type) {
      if (a.type === 'rsvp') return -1;
      if (b.type === 'rsvp') return 1;
      if (a.type === 'featured') return -1;
      if (b.type === 'feature') return 1;
    }
    if (a.name !== b.name) return a.name < b.name ? -1 : 1;
    return 0;
  },

  getEventFilterColor: function (filter, i, filters) {
    return filter.color || (
      filter.type === 'rsvp' ?
      RSVP_COLOR :
      tinycolor({h: i * (360 / filters.length), s: 1, l: 0.4}).toHex()
    );
  },

  renderEventFilter: function (eventFilter, i) {
    return (
      <EventFilterListItem
        key={eventFilter.id}
        header={this.props.header}
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
