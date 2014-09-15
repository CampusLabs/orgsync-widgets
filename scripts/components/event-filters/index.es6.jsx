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

  handleChange: function (ev) {
    var active = ev.target.checked;
    var eventFilters = this.state.eventFilters;
    var first = eventFilters.slice(0, 1);
    var setActive = _.partial(update, _, {active: {$set: active}});
    var rest = _.map(eventFilters.slice(1), setActive);
    this.update({eventFilters: {$set: first.concat(rest)}});
  },

  renderHeader: function () {
    var header = this.props.header;
    var checked =
       _.every(this.state.eventFilters.slice(1), _.matches({active: true}));
    return (
      <div>
        <hr />
        <div className='osw-event-filters-list-item osw-header'>
          <label>
            <div className='osw-name'>
              <input
                type='checkbox'
                checked={checked}
                onChange={this.handleChange}
              />
              {header}
            </div>
          </label>
        </div>
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

  renderEventFilters: function () {
    if (this.state.isLoading) {
      return <div className='osw-loading'>Loading...</div>;
    }
    if (this.state.error) {
      return <div className='osw-error'>{this.state.error}</div>;
    }
    var eventFilters = this.state.eventFilters;
    return (
      <div className='osw-event-filters'>
        {_.map(eventFilters.slice(0, 1), this.renderEventFilter)}
        {this.renderHeader()}
        {_.map(eventFilters.slice(1), this.renderEventFilter)}
      </div>
    );
  },

  render: function () {
    return (
      <div className='osw-inset-block osw-event-filters-index'>
       {this.renderEventFilters()}
      </div>
    );
  }
});
