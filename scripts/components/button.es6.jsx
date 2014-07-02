/** @jsx React.DOM */

import React from 'react';

export default React.createClass({
  getClassName: function () {
    var classes = ['osw-button'];
    if (this.props.isSelected) classes.push('osw-button-selected');
    return classes.join(' ');
  },

  render: function () {
    var component = this.props.href ? React.DOM.a : React.DOM.span;
    return this.transferPropsTo(
      <component className={this.getClassName()}>
        {this.props.children}
      </component>
    );
  }
});
