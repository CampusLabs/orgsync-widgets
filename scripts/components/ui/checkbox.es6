import Cursors from 'cursors';
import Icon from 'components/ui/icon';
import React from 'react';

export default React.createClass({
  mixins: [Cursors],

  render: function () {
    var cx = React.addons.classSet;
    var classes = cx({
      'osw-checkbox': true,
      'osw-checkbox-colored': this.props.color,
      'osw-checkbox-unchecked': !this.props.checked
    });

    var styles = {}
    if (this.props.color) {
      styles = {background: '#' + this.props.color}
    }

    return (
      <div onClick={this.props.handleChange} className={this.props.className}>
        <div className={classes} style={styles}>
          <Icon name='check' />
        </div>
        <input
          type='checkbox'
          defaultChecked={this.props.checked}
          style={{display: 'none'}}
        />
        {this.props.label}
      </div>
    );
  }
});
