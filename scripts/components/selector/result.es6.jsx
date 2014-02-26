/** @jsx React.DOM */

import React from 'react';

export default React.createClass({
  onClick: function () {
    this.props.onClick(this.props.selectorItem);
  },

  className: function () {
    var classes = ['selector-result'];
    if (this.props.selected) classes.push('selected');
    if (this.props.active) classes.push('active');
    return classes.join(' ');
  },

  name: function () {
    var selectorItem = this.props.selectorItem;
    var name = selectorItem.get('name');
    return selectorItem.isArbitrary() ? 'Add "' + name + '"...' : name;
  },

  render: function () {
    return (
      <div className={this.className()} onClick={this.onClick}>
        <div className='name'>{this.name()}</div>
      </div>
    );
  }
});
