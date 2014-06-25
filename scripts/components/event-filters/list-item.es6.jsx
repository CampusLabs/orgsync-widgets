/** @jsx React.DOM */

import Cursors from 'cursors';
import Icon from 'components/icon';
import React from 'react';

var ICON_MAP = {
  organization: 'organization',
  service_partner: 'service',
  umbrella: 'umbrella',
  service_umbrella: 'service',
  featured: 'promote',
  rsvp: 'check'
};

export default React.createClass({
  mixins: [Cursors],

  handleChange: function (ev) {
    this.update('eventFilter', {active: {$set: ev.target.checked}});
  },

  render: function () {
    var eventFilter = this.state.eventFilter;
    return (
      <div
        className='osw-event-filters-list-item'
        style={{color: '#' + eventFilter.color}}
      >
        <label>
          <Icon name={ICON_MAP[eventFilter.type]} />
          <input
            type='checkbox'
            checked={eventFilter.active}
            onChange={this.handleChange}
          />
          {eventFilter.name}
        </label>
      </div>
    );
  }
});
