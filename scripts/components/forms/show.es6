import api from 'api';
import Button from 'components/ui/button';
import ButtonRow from 'components/ui/button-row';
import Cursors from 'cursors';
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
    api.get(
      '/portals/:portal_id/forms/:id',
      {portal_id: form.portal.id, id: form.id},
      this.handleFetch
    );
  },

  handleFetch: function (er, res) {
    var deltas = {isLoading: {$set: false}};
    if (er) deltas.error = {$set: er};
    else deltas.form = {$set: res.data};
    this.update(deltas);
  },

  showCreator: function(form) {
    return (
      "Created by " + form.creator.display_name
    );
  },

  renderDescription: function(description) {
    if(!description || /^\s*$/.test(description)) return 'No description provided';
    return (description);
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
        <div className='osw-forms-show-creator'>
          {this.showCreator(form)}
        </div>
        <div className='osw-forms-show-description'>
          {this.renderDescription(form.description)}
        </div>
        <ButtonRow>
          <Button href={form.links.web} target='_parent'>
            On OrgSync.com
          </Button>
          <Button href={form.links.pdf_link} target='_parent'>
            PDF
          </Button>
        </ButtonRow>
      </div>
    );
  }
});
