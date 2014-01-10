/** @jsx React.DOM */

import React from 'react';

export default React.createClass({
  render: function () {
    return <i className={'icon-' + this.props.name}></i>;
  }
});
