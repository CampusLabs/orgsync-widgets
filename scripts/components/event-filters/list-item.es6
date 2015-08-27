import Checkbox from 'components/ui/checkbox';
import Cursors from 'cursors';
import Icon from 'components/ui/icon';
import React from 'react';

export default React.createClass({
  mixins: [Cursors],

  render: function () {
    var eventFilter = this.state.eventFilter;
    return (
      <label className='osw-event-filters-list-item'>
        <div className='osw-event-filters-list-item-name'>
          <Checkbox
            cursors={{boolState: this.getCursor('eventFilter', 'active')}}
            color={eventFilter.hex}
            onChange={this.handleChange}
            label={eventFilter.name}
          />
        </div>
      </label>
    );
  }
});
