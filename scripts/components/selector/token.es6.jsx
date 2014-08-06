/** @jsx React.DOM */

import Cursors from 'cursors';
import Icon from 'components/icon';
import React from 'react';

export default React.createClass({
  mixins: [Cursors],

  render: function () {
    return (
      <div className='osw-selector-token'>
        <Icon
          className='osw-selector-token-remove'
          name='delete'
          onClick={this.props.onRemoveClick}
        />
        <div className='osw-selector-token-name'>{this.props.item.name}</div>
      </div>
    );
  }
});
