/** @jsx React.DOM */

import React from 'react';

export default React.createClass({
  componentDidMount: function () {
    this.resize();
    window.addEventListener('resize', this.resize);
  },

  componentWillUnmount: function () {
    window.removeEventListener('resize', this.resize);
  },

  componentDidUpdate: function () {
    this.resize();
  },

  resize: function () {
    var el = this.getDOMNode();
    el.style.height = 0;
    var padding = el.clientHeight;
    var border = el.offsetHeight - padding;
    el.style.height = '1px';
    var isBorderBox = padding === el.clientHeight;
    var offset = isBorderBox ? border : -padding;
    el.style.height = (el.scrollHeight + offset) + 'px';
  },

  render: function () {
    return this.transferPropsTo(<textarea />);
  }
});
