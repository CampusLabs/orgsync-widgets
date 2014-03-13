/** @jsx React.DOM */

import React from 'react';

export default React.createClass({
  render: function () {
    var account = this.props.account;
    return (
      <div className='osw-accounts-list-item'>
        <div className='osw-picture'><img src={account.picture()} /></div>
        <div className='osw-first-name'>{account.get('first_name')}</div>
        <div className='osw-last-name'>{account.get('last_name')}</div>
      </div>
    );
  }
});
