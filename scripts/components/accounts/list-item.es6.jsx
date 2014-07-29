/** @jsx React.DOM */

import {picture} from 'entities/account';
import React from 'react';

export default React.createClass({
  render: function () {
    var account = this.props.account;
    return (
      <div className='osw-accounts-list-item'>
        <div className='osw-picture'><img src={picture(account)} /></div>
        <div className='osw-first-name'>{account.first_name}</div>
        <div className='osw-last-name'>{account.last_name}</div>
      </div>
    );
  }
});
