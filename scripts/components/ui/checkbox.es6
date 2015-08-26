import Icon from 'components/ui/icon';
import React from 'react';

export default React.createClass({

  getDefaultProps: function () {
    return {
      boolState: false
    }
  },

  getInitialState: function () {
    return {
      boolState: this.props.boolState
    };
  },

  render: function () {

    var classes = 'osw-checkbox';

    if (this.state.boolState) {
      if (this.props.colored) {
        classes += ' osw-checkbox-colored-checked'
      } else {
        classes += ' osw-checkbox-checked';
      }
    }

    var styles = {}
    if (this.props.color) {
      styles = {background: '#' + this.props.color}
    }
    console.log(this.state.boolState);
    return (
      <Icon name='check' className={classes} style={styles} />
    );
  }
});
