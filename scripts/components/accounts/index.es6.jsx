/** @jsx React.DOM */

module Account from 'entities/account';
import AccountsListItem from 'components/accounts/list-item';
import CoercedPropsMixin from 'mixins/coerced-props';
import List from 'components/list';
module Portal from 'entities/portal';
import React from 'react';

export default React.createClass({
  mixins: [CoercedPropsMixin],

  getCoercedProps: function () {
    return {
      accounts: {
        type: Account.Collection,
        alternates: {
          portalId:
            (new Portal.Model({id: this.props.portalId})).get('accounts')
        }
      }
    };
  },

  renderListItem: function (account) {
    return <AccountsListItem key={account.id} account={account} />;
  },

  render: function () {
    return (
      <List
        className='accounts-index'
        collection={this.props.accounts}
        renderListItem={this.renderListItem}
        uniform={true}
        rowThreshold={50}
        fetchPageSize={100}
      />
    );
  }
});
