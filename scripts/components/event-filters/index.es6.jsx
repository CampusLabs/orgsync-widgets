/** @jsx React.DOM */

import _ from 'underscore';
import Cursors from 'cursors';
import EventFilterListItem from 'components/event-filters/list-item';
import React from 'react';

export default React.createClass({
  mixins: [Cursors],

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
