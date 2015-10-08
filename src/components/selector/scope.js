import {Mixin as Cursors} from 'cursors';
import React from 'react';

import {getDisplayName} from 'entities/selector/item';

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
    if (!this.props.scope.selectable) return;
    return (
      <input
        checked={this.props.isSelected}
        className='osw-selector-scope-toggle'
        onChange={this.handleChange}
        onClick={STOP_PROPAGATION}
        type='checkbox'
      />
    );
  },

  renderName: function () {
    var name = getDisplayName(this.props.scope);
    var count = this.props.count;
    if (!count) return name;
    return <strong>{name} ({count})</strong>;
  },

  render: function () {
    return (
      <div className={this.getClassName()} onClick={this.props.onClick}>
        {this.renderToggle()}
        <div className='osw-selector-scope-name'>{this.renderName()}</div>
      </div>
    );
  }
});
