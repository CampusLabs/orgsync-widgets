/** @jsx React.DOM */

import React from 'react';

export default React.createClass({
  handleClick: function () {
    if (this.props.onClick) this.props.onClick(this.props.photo);
  },

  render: function () {
    return <div onClick={this.handleClick}>This is a photo</div>;
  }
});
