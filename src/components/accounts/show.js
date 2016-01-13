import _ from 'underscore';
import _str from 'underscore.string';
import api from '../../utils/api';
import Button from '../ui/button';
import config from '../../config';
import Cursors from 'cursors';
import React from 'react';

import {getPictureUrl} from '../../entities/account';

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

  renderTitle: function () {
    var title = this.state.account.title;
    if (title) return <div className='osw-accounts-show-title'>{title}</div>;
  },

  renderSimpleField: function (key, title) {
    var content = this.state.account[key];
    if (!content) return;
    content =
      key === 'email_address' ?
      <a href={`mailto:${content}`}>{content}</a> :
      this.renderInLines(content);
    return this.renderField(title, content);
  },

  renderAddress: function () {
    var address = this.state.account.address;
    if (!address) return;
    var content = _.compact([
      address.street,
      _.compact([
        _.compact([address.city, address.state]).join(', '),
        address.zip
      ]).join(' '),
      address.country
    ]).join('\n');
    if (!content) return;
    return this.renderField('Address', this.renderInLines(content));
  },

  renderInLines: function (str) {
    return _.map(_str.lines(str), (line, i) => <div key={i}>{line}</div>);
  },

  renderField: function (title, content) {
    return (
      <div className='osw-accounts-show-field'>
        <div className='osw-accounts-show-field-title'>{title}</div>
        <div className='osw-accounts-show-field-content'>{content}</div>
      </div>
    );
  },

  renderAccount: function () {
    var account = this.state.account;
    return (
      <div>
        <img
          className='osw-accounts-show-picture'
          src={getPictureUrl(account)}
        />
        <div className='osw-accounts-show-name'>{account.display_name}</div>
        {this.renderTitle()}
        {this.renderSimpleField('email_address', 'Email')}
        {this.renderSimpleField('phone_number', 'Phone')}
        {this.renderAddress()}
        {this.renderSimpleField('about_me', 'About Me')}
        <div className='osw-accounts-show-send-a-message'>
          <Button href={`${config.io.uri}/messages/new?account=${account.id}`}>
            Send a Message
          </Button>
        </div>
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
