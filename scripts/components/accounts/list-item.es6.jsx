import {getPictureUrl} from 'entities/account';
import React from 'react';

export default React.createClass({
  render: function () {
    var account = this.props.account;
    return (
      <div className='osw-accounts-list-item'>
        <img
          className='osw-accounts-list-item-picture'
          src={getPictureUrl(account)}
        />
        <div className='osw-accounts-list-item-first-name'>
          {account.first_name}
        </div>
        <div className='osw-accounts-list-item-last-name'>
          {account.last_name}
        </div>
      </div>
    );
  }
});
