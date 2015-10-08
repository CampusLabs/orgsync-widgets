import $ from 'jquery';
import {Mixin as Cursors} from 'cursors';
import React from 'react';
import ReactDOM from 'react-dom';

export default React.createClass({
  mixins: [Cursors],

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

  resize: function () {
    var el = ReactDOM.findDOMNode(this);
    var $el = $(el);
    var minHeight = el.style.minHeight;
    $el.css({minHeight: 0, height: 0});
    var targetHeight = Math.round(el.scrollHeight);
    var clientHeight = Math.round(el.clientHeight);
    var innerHeight = Math.round($el.innerHeight());
    if (clientHeight === innerHeight) targetHeight -= el.clientHeight;
    if ($el.css('boxSizing') === 'border-box') targetHeight += el.offsetHeight;
    $el.css({minHeight: minHeight, height: targetHeight});
  },

  render: function () {
    return <textarea {...this.props} />;
  }
});
