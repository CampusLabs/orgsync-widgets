/** @jsx React.DOM */

import React from 'react';

export default React.createClass({
  getClassName: function () {
    var classes = ['osw-button'];
    if (this.props.isSelected) classes.push('osw-button-selected');
    if (this.props.disabled) classes.push('osw-button-disabled');
    return classes.join(' ');
  },

  render: function () {
    var Component = this.props.href ? React.DOM.a : React.DOM.button;
    return this.transferPropsTo(
      <Component
        type={this.props.type || 'button'}
        className={this.getClassName()}
      >
        {this.props.children}
      </Component>
    );
  }
});
