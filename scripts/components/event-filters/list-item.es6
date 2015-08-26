import Checkbox from 'components/ui/checkbox';
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
        <div className='osw-event-filters-list-item-name'>
          <Checkbox cursors={{boolState: this.getCursor('eventFilter', 'active')}} color={eventFilter.hex} />
          <input
            className='osw-event-filters-list-item-checkbox'
            type='checkbox'
            checked={eventFilter.active}
            onChange={this.handleChange}
            style={{display: 'none'}}
          />
          {eventFilter.name}
        </div>
      </label>
    );
  }
});
