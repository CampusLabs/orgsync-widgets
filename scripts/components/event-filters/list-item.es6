import Checkbox from 'components/ui/checkbox';
import Cursors from 'cursors';
import Icon from 'components/ui/icon';
import React from 'react';

export default React.createClass({
  mixins: [Cursors],

  handleChange: function (ev) {
    this.update({eventFilter: {active: {$set: !ev}}});
  },

  render: function () {
    var eventFilter = this.state.eventFilter;
    console.log(this.state.eventFilter.active);
    return (
      <label className='osw-event-filters-list-item'>
        <div className='osw-event-filters-list-item-name'>
          <Checkbox
            checked={this.state.eventFilter.active}
            color={eventFilter.hex}
            label={eventFilter.name}
            clickHandler={this.handleChange}
          />
        </div>
      </label>
    );
  }
});
