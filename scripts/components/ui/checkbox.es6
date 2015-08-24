import joinClassNames from 'utils/join-class-names';
import React from 'react';

export default React.createClass({
  mixins: [Cursors],

  setInitialState: function () {
    boolState: this.props.boolState;
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

    return (
      <Icon name='check' className={classes} />
    );
  }
});
