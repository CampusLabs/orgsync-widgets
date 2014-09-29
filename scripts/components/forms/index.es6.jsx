/** @jsx React.DOM */

import _ from 'underscore';
import api from 'api';
import FormsListItem from 'components/forms/list-item';
import Cursors from 'cursors';
import List from 'react-list';
import React from 'react';

var PER_PAGE = 10;

export default React.createClass({
  mixins: [Cursors],

  getInitialState: function () {
    return {
      forms: []
    };
  },

  fetch: function (cb) {
    api.get('/portals/:portal_id/forms', {
      portal_id: this.props.portalId,
      page: Math.floor(this.state.forms.length / PER_PAGE) + 1,
      per_page: PER_PAGE
    }, _.partial(this.handleFetch, cb));
  },

  handleFetch: function (cb, er, res) {
    if (er) return cb(er);
    this.update({
      forms: {$set: _.unique(this.state.forms.concat(res.data), 'id')}
    });
    cb(null, res.data.length < PER_PAGE);
  },

  renderListItem: function (form) {
    return <FormsListItem key={form.id} form={form} />;
  },

  render: function () {
    return (
      <List
        className='osw-forms-index'
        items={this.state.forms}
        renderItem={this.renderListItem}
        fetch={this.fetch}
        uniform={true}
      />
    );
  }
});
