/** @jsx React.DOM */

import Cursors from 'cursors';
import React from 'react';

export default React.createClass({
  mixins: [Cursors],

  render: function () {
    var event = this.props.event;
    return (
      <div className='osw-events-show'>
        {this.props.date}
        {this.props.event}
      </div>
    );
  }
});
