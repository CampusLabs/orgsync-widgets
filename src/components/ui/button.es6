import Cursors from 'cursors';
import joinClassNames from 'utils/join-class-names';
import React from 'react';

export default React.createClass({
  mixins: [Cursors],

  getDefaultProps: function () {
    return {
      baseClassName: 'osw-button'
    };
  },

  getClassName: function () {
    var classes = [this.props.baseClassName];
    if (this.props.isSelected) classes.push('osw-button-selected');
    if (this.props.disabled) classes.push('osw-button-disabled');
    return joinClassNames(classes.join(' '), this.props.className);
  },

  renderAnchor: function () {
    return (
      <a {...this.props} className={this.getClassName()}>
        {this.props.children}
      </a>
    );
  },

  renderButton: function () {
    return (
      <button type='button' {...this.props} className={this.getClassName()}>
        {this.props.children}
      </button>
    );
  },

  render: function () {
    return this.props.href ? this.renderAnchor() : this.renderButton();
  }
});
