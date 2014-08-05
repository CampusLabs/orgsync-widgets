/** @jsx React.DOM */

import Cursors from 'cursors';
import React from 'react';

export default React.createClass({
  mixins: [Cursors],

  getClassName: function () {
    var classes = ['osw-selector-scope'];
    if (this.props.selected) classes.push('osw-selector-scope-selected');
    return classes.join(' ');
  },

  render: function () {
    return (
      <div className={this.getClassName()} onClick={this.props.onClick}>
        {this.props.scope.name}
      </div>
    );
  }
});
