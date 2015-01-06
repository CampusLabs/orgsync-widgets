import _ from 'underscore';
import api from 'api';
import Button from 'components/ui/button';
import ButtonRow from 'components/ui/button-row';
import Cursors from 'cursors';
import React from 'react';

import {getPictureUrl} from 'entities/account';

export default React.createClass({
  mixins: [Cursors],

  getInitialState: function () {
    return {
      isLoading: false,
      error: null,
      account: this.props.account
    };
  },

  componentDidMount: function () {
    if (!this.state.account) this.fetchAccount();
  },

  fetchAccount: function () {
    this.update({isLoading: {$set: true}, error: {$set: null}});
    api.get('/accounts/:id', {
      id: this.props.accountId,
      portal_id: this.props.portalId
    }, this.handleAccount);
  },

  handleAccount: function (er, res) {
    this.update({
      isLoading: {$set: false},
      error: {$set: er},
      account: {$set: er ? null : res.data}
    });
  },

  renderAccount: function () {
    var account = this.state.account;
    return (
      <div>
        <img
          className='osw-accounts-show-picture'
          src={getPictureUrl(account)}
        />
        <div className='osw-accounts-show-name'>
          {account.display_name}
        </div>
        <div className='osw-accounts-show-title'>
          {account.title}
        </div>
        <ButtonRow>
          <Button>Send a Message</Button>
        </ButtonRow>
      </div>
    );
  },

  render: function () {
    return (
      <div className='osw-accounts-show'>
        {
          this.state.account ? this.renderAccount() :
          this.state.error ? this.state.error.toString() :
          'Loading...'
        }
      </div>
    );
  }
});
