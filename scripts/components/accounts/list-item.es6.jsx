/** @jsx React.DOM */

import React from 'react';

export default React.createClass({
  render: function () {
    var account = this.props.account;
    return (
      <div className='accounts-list-item'>
        <div className='picture'><img src={account.picture()} /></div>
        <div className='first-name'>{account.get('first_name')}</div>
        <div className='last-name'>{account.get('last_name')}</div>
      </div>
    );
  }
});
