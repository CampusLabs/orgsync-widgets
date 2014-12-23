import _ from 'underscore';
import api from 'api';
import PeopleListItem from 'components/people/list-item';
import Cursors from 'cursors';
import List from 'react-list';
import React from 'react';

var PER_PAGE = 100;

export default React.createClass({
  mixins: [Cursors],

  getInitialState: function () {
    return {
      accounts: []
    };
  },

  fetch: function (cb) {
    api.get('/portals/:portal_id/people', {
      portal_id: this.props.portalId,
      page: Math.floor(this.state.accounts.length / PER_PAGE) + 1,
      per_page: PER_PAGE
    }, _.partial(this.handleFetch, cb));
  },

  handleFetch: function (cb, er, res) {
    if (er) return cb(er);
    this.update({
      accounts: {$set: _.unique(this.state.accounts.concat(res.data), 'id')}
    });
    cb(null, res.data.length < PER_PAGE);
  },

  renderListItem: function (account) {
    return <PeopleListItem key={account.id} account={account} />;
  },

  render: function () {
    return (
      <List
        className='osw-people-index'
        items={this.state.accounts}
        renderItem={this.renderListItem}
        fetch={this.fetch}
        uniform={true}
      />
    );
  }
});
