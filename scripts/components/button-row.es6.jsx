/** @jsx React.DOM */

import React from 'react';

export default React.createClass({
  render: function () {
    return this.transferPropsTo(
      <div className='osw-button-row'>{this.props.children}</div>
    );
  }
});
