import Checkbox from 'components/ui/checkbox';
import {Mixin} from 'cursors';
import Icon from 'components/ui/icon';
import React from 'react';

export default React.createClass({
  mixins: [Mixin],

  handleChange: function (ev) {
    this.update({eventFilter: {active: {$set: ev.target.checked}}});
  },

  render: function () {
    var eventFilter = this.state.eventFilter;
    return (
      <Checkbox
        checked={this.state.eventFilter.active}
        className='osw-event-filters-list-item'
        color={eventFilter.hex}
        label={eventFilter.name}
        handleChange={this.handleChange}
      />
    );
  }
});
