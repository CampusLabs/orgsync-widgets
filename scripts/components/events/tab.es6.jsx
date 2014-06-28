/** @jsx React.DOM */

import _str from 'underscore.string';
import Cursors from 'cursors';
import React from 'react';

export default React.createClass({
  mixins: [Cursors],

  getClassName: function () {
    var classes = ['osw-button'];
    if (this.props.view === this.state.currentView) {
      classes.push('osw-selected');
    }
    return classes.join(' ');
  },

  handleClick: function () {
    this.update('currentView', {$set: this.props.view});
  },

  render: function () {
    return (
      <span className={this.getClassName()} onClick={this.handleClick}>
        {_str.capitalize(this.props.view)}
      </span>
    );
  }
});
