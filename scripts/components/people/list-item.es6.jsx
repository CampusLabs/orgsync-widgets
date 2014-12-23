import {getPictureUrl} from 'entities/account';
import Cursors from 'cursors';
import Popup from 'components/popup';
import React from 'react';
import Show from 'components/people/show';

export default React.createClass({
  mixins: [Cursors],

  getInitialState: function () {
    return {
      isOpen: false
    };
  },

  onPersonClick: function (ev) {
    ev.preventDefault();
    this.open();
  },

  open: function () {
    this.update({isOpen: {$set: true}});
  },

  close: function () {
    this.update({isOpen: {$set: false}});
  },

  renderShow: function () {
    if (!this.state.isOpen) return;
    return (
      <Show account={this.props.account} />
    );
  },

  render: function () {
    var account = this.props.account;
    return (
      <div className='osw-people-list-item'>
        <a onClick={this.onPersonClick}>
          <img
            className='osw-people-list-item-picture'
            src={getPictureUrl(account)}
          />
          <div className='osw-people-list-item-first-name'>
            {account.first_name}
          </div>
          <div className='osw-people-list-item-last-name'>
            {account.last_name}
          </div>
          <div className='osw-people-list-item-title'>
            {account.title}
          </div>
        </a>
        <Popup
          name='person-show'
          close={this.close}
          title={account.display_name}
        >
          {this.renderShow()}
        </Popup>
      </div>
    );
  }
});
