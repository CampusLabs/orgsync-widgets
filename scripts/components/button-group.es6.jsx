/** @jsx React.DOM */

import React from 'react';

export default React.createClass({
  render: function () {
    return this.transferPropsTo(
      <div className='osw-button-group'>{this.props.children}</div>
    );
  }
});
