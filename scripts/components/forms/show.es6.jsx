/** @jsx React.DOM */

import api from 'api';
import Cursors from 'cursors';
import Button from 'components/button';
import ButtonRow from 'components/button-row';
import React from 'react';

export default React.createClass({
  mixins: [Cursors],

  getInitialState: function () {
    return {
      isLoading: false,
      error: null
    };
  },

  componentWillMount: function () {
    var form = this.state.form;
    if (form.description != null) return;
    this.update({isLoading: {$set: true}, error: {$set: null}});
    api.get('/portals/:portal_id/forms/:id', {portal_id: form.portal.id, id: form.id}, this.handleFetch);
  },

  handleFetch: function (er, res) {
    console.log("Show form:");
    console.log(res);
    var deltas = {isLoading: {$set: false}};
    if (er) deltas.error = {$set: er};
    else deltas.form = {$set: res.data};
    this.update(deltas);
  },

  render: function () {
    var form = this.state.form;
    return (
      <div className='osw-forms-show'>
        <div className='osw-forms-show-name'>
          {form.name}
        </div>
        <div className='osw-forms-show-category'>
          {form.category.name}
        </div>
        <ButtonRow>
          <Button href={form.links.web}>On OrgSync.com</Button>
        </ButtonRow>
      </div>
    );
  }
});
