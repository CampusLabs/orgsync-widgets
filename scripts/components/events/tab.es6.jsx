/** @jsx React.DOM */

import _str from 'underscore.string';
import Cursors from 'cursors';
import React from 'react';

export default React.createClass({
  mixins: [Cursors],

  getClassName: function () {
    var classes = ['osw-button osw-events-tab'];
    var view = this.props.view;
    var currentView = this.state.currentView;
    if (this.props.selected) classes.push('osw-selected');
    return classes.join(' ');
  },

  handleClick: function () {
    if (!this.props.selected) {
      this.update('currentView', {$set: this.props.view});
    }
  },

  render: function () {
    return (
      <span className={this.getClassName()} onClick={this.handleClick}>
        {this.props.name || _str.capitalize(this.props.view)}
      </span>
    );
  }
});
