/** @jsx React.DOM */

import Cursors from 'cursors';
import React from 'react';

export default React.createClass({
  mixins: [Cursors],

  render: function () {
    var options = this.props.renderOptions();
    var value = this.props.value;
    if (options.length === 2) value = options[1].props.value;
    return this.transferPropsTo(
      <div className='osw-big osw-field oswi osw-dropdown'>
        <select
          name={this.props.name}
          value={value}
          onChange={this.props.onChange}
        >
          {options}
        </select>
      </div>
    );
  }
});
