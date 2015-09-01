import Cursors from 'cursors';
import Icon from 'components/ui/icon';
import React from 'react';

export default React.createClass({
  mixins: [Cursors],

  getInitialState: function () {
    return {
      checked: this.props.checked
    }
  },

  handleClick: function (ev) {
    this.update({checked: {$set: !this.state.checked}});
  },

  render: function () {
    var cx = React.addons.classSet;
    var classes = cx({
      'osw-checkbox': true,
      'osw-checkbox-colored': this.props.color,
      'osw-checkbox-unchecked': !this.state.checked
    });

    var styles = {}
    if (this.props.color) {
      styles = {background: '#' + this.props.color}
    }

    return (
      <div onClick={this.handleClick}>
        <div className={classes} style={styles}>
          <Icon name='check' />
        </div>
        <input
          type='checkbox'
          defaultChecked={this.state.checked}
          style={{display: 'none'}}
        />
        {this.props.label}
      </div>
    );
  }
});
