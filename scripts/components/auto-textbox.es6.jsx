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
    var el = this.getDOMNode();
    var $el = $(el);
    var minHeight = el.style.minHeight;
    $el.css({minHeight: 0, height: 0});
    var targetHeight = el.scrollHeight;
    var clientHeight = el.clientHeight;
    var innerHeight = $el.innerHeight();
    if (clientHeight === innerHeight) targetHeight -= el.clientHeight;
    if ($el.css('boxSizing') === 'border-box') targetHeight += el.offsetHeight;
    $el.css({minHeight: minHeight, height: targetHeight});
  },

  render: function () {
    return this.transferPropsTo(<textarea />);
  }
});
