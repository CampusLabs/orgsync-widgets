/** @jsx React.DOM */

import $ from 'jquery';
import React from 'react';

export default React.createClass({
  componentDidMount: function () {
    $(window).on('resize', this.resize);
    this.resize();
  },

  componentWillUnmount: function () {
    $(window).off('resize', this.resize);
  },

  componentDidUpdate: function () {
    this.resize();
  },

  shouldComponentUpdate: function (nextProps) {
    return this.props.value !== nextProps.value;
  },

  resize: function () {
    var $el = $(this.getDOMNode());
    $el.height(0);
    var targetHeight = $el.prop('scrollHeight');
    var clientHeight = $el.prop('clientHeight');
    var innerHeight = $el.innerHeight();
    if (clientHeight === innerHeight) targetHeight -= clientHeight;
    $el.height(targetHeight);
  },

  render: function () {
    return this.transferPropsTo(<textarea />);
  }
});
