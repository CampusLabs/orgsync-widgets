import Cursors from 'cursors';
import Icon from 'components/ui/icon';
import React from 'react';

var ICON_MAP = {
  category: 'book',
  featured: 'promote',
  organization: 'organization',
  rsvp: 'check',
  service_partner: 'service',
  service_umbrella: 'service',
  umbrella: 'umbrella'
};

export default React.createClass({
  mixins: [Cursors],

  handleChange: function (ev) {
    this.update({eventFilter: {active: {$set: ev.target.checked}}});
  },

  render: function () {
    var eventFilter = this.state.eventFilter;
    return (
      <label className='osw-event-filters-list-item'>
        <Icon
          className='osw-event-filters-list-item-icon'
          name={ICON_MAP[eventFilter.type]}
          style={{color: '#' + eventFilter.hex}}
        />
        <div className='osw-event-filters-list-item-name'>
          <input
            className='osw-event-filters-list-item-checkbox'
            type='checkbox'
            checked={eventFilter.active}
            onChange={this.handleChange}
          />
          {eventFilter.name}
        </div>
      </label>
    );
  }
});
