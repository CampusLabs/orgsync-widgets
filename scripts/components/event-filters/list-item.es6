import Checkbox from 'components/ui/checkbox';
import Cursors from 'cursors';
import Icon from 'components/ui/icon';
import React from 'react';

export default React.createClass({
  mixins: [Cursors],

  handleChange: function (ev) {
    console.log(ev.target);
    this.update({eventFilter: {active: {$set: ev.target.checked}}});
  },

  render: function () {
    var eventFilter = this.state.eventFilter;
    return (
      <label className='osw-event-filters-list-item'>
        <div className='osw-event-filters-list-item-name'>
          <Checkbox
            checked={this.state.eventFilter.active}
            color={eventFilter.hex}
            label={eventFilter.name}
            handleChange={this.handleChange}
          />
        </div>
      </label>
    );
  }
});
