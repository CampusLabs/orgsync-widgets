/** @jsx React.DOM */

import React from 'react';

export default React.createClass({
  render: function () {
    return (
      <div className='accounts-list-item'>
        <div className='avatar'>
          <img src={this.props.account.get('picture_url')} />
        </div>
        <div className='first-name'>
          {this.props.account.get('first_name')}
        </div>
        <div className='last-name'>
          {this.props.account.get('last_name')}
        </div>
      </div>
    );
  }
});
