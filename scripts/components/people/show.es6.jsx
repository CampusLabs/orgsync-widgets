import {getPictureUrl} from 'entities/account';
import Button from 'components/button';
import React from 'react';

export default React.createClass({

  render: function () {
    var account = this.props.account;
    return (
      <div className='osw-people-show'>
        <img
          className='osw-people-show-picture'
          src={getPictureUrl(account)}
        />
        <div className='osw-people-show-name'>
          {account.display_name}
        </div>
        <div className='osw-people-show-title'>
          {account.title}
        </div>
        <div className='button-row'>
          <Button>Send a Message</Button>
        </div>
      </div>
    );
  }
});
