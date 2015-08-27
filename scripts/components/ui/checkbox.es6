import Cursors from 'cursors';
import Icon from 'components/ui/icon';
import React from 'react';

export default React.createClass({
  mixins: [Cursors],

  handleChange: function (ev) {
    this.update({boolState:{$set: ev.target.checked}});
  },

  renderCheck: function () {
    if (!this.state.boolState) return;
    return (
      <Icon name='check' />
    );
  },

  render: function () {

    var classes = 'osw-checkbox';

    if (this.props.colored) {
      classes += ' osw-checkbox-colored-checked'
    } else {
      classes += ' osw-checkbox-checked';
    }

    var styles = {}
    if (this.props.color) {
      styles = {background: '#' + this.props.color}
    }


    return (
      <div>
        <div className={classes} style={styles}>
          {this.renderCheck()}
        </div>
        <input
          type='checkbox'
          checked={this.state.boolState}
          onChange={this.handleChange}
          style={{display: 'none'}}
        />
        {this.props.label}
      </div>
    );
  }
});
