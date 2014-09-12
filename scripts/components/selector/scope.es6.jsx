/** @jsx React.DOM */

import Cursors from 'cursors';
import React from 'react';

import {isArbitrary} from 'entities/selector/item';

var STOP_PROPAGATION = function (ev) {
  ev.stopPropagation();
};

export default React.createClass({
  mixins: [Cursors],

  handleChange: function () {
    this.props.onResultClick(this.props.scope);
  },

  getClassName: function () {
    var classes = ['osw-selector-scope'];
    if (this.props.isActive) classes.push('osw-selector-scope-active');
    return classes.join(' ');
  },

  renderToggle: function () {
    if (isArbitrary(this.props.scope)) return;
    return (
      <input
        type='checkbox'
        className='osw-selector-scope-toggle'
        checked={this.props.isSelected}
        onChange={this.handleChange}
        onClick={STOP_PROPAGATION}
      />
    );
  },

  render: function () {
    return (
      <div className={this.getClassName()} onClick={this.props.onClick}>
        {this.renderToggle()}
        {this.props.scope.name}
      </div>
    );
  }
});
