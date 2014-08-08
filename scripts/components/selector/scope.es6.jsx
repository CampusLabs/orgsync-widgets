/** @jsx React.DOM */

import Cursors from 'cursors';
import React from 'react';

import {isArbitrary} from 'entities/selector/item';

export default React.createClass({
  mixins: [Cursors],

  handleToggleClick: function (ev) {
    ev.stopPropagation();
    this.props.onResultClick(this.props.scope);
  },

  getClassName: function () {
    var classes = ['osw-selector-scope'];
    if (this.props.selected) classes.push('osw-selector-scope-selected');
    return classes.join(' ');
  },

  renderToggle: function () {
    if (isArbitrary(this.props.scope)) return;
    return <span onClick={this.handleToggleClick}>Toggle</span>;
  },

  render: function () {
    return (
      <div className={this.getClassName()} onClick={this.props.onClick}>
        {this.renderToggle()}
        {' '}
        {this.props.scope.name}
      </div>
    );
  }
});
