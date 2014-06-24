/** @jsx React.DOM */

import Cursors from 'cursors';
import React from 'react';

export default React.createClass({
  mixins: [Cursors],

  handleChange: function (ev) {
    this.update('eventFilter', {active: {$set: ev.target.checked}});
  },

  render: function () {
    var eventFilter = this.state.eventFilter;
    return (
      <div className='osw-event-filters-list-item'>
        <label>
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
