import Cursors from 'cursors';
import Icon from 'components/ui/icon';
import React from 'react';

export default React.createClass({
  mixins: [Cursors],

  handleChange: function (ev) {
    this.update({checked:{$set: ev.target.checked}});
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
      <div>
        <div className={classes} style={styles}>
          <Icon name='check' />
        </div>
        <input
          type='checkbox'
          checked={this.state.checked}
          onChange={this.handleChange}
          style={{display: 'none'}}
        />
        {this.props.label}
      </div>
    );
  }
});
