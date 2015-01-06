import api from 'api';
import Cursors from 'cursors';
import Button from 'components/ui/button';
import ButtonRow from 'components/ui/button-row';
import React from 'react';

var DEFAULT_SRC = 'https://orgsync.com/assets/no_org_profile_150.png';

export default React.createClass({
  mixins: [Cursors],

  getInitialState: function () {
    return {
      isLoading: false,
      error: null
    };
  },

  getSrc: function () {
    return this.state.portal.picture_url || DEFAULT_SRC;
  },

  componentWillMount: function () {
    var portal = this.state.portal;
    if (portal.description != null) return;
    this.update({isLoading: {$set: true}, error: {$set: null}});
    api.get('/portals/:id', {id: portal.id}, this.handleFetch);
  },

  handleFetch: function (er, res) {
    var deltas = {isLoading: {$set: false}};
    if (er) deltas.error = {$set: er};
    else deltas.portal = {$set: res.data};
    this.update(deltas);
  },

  renderDescription: function () {
    if (this.state.isLoading) return 'Loading...';
    if (this.state.error) return this.state.error;
    return this.state.portal.description;
  },

  renderWebsiteLink: function () {
    var url = this.state.portal.website_url;
    return url && <Button href={url}>Website</Button>;
  },

  render: function () {
    var portal = this.state.portal;
    return (
      <div className='osw-portals-show'>
        <img
          className='osw-portals-show-picture'
          src={this.getSrc()}
          alt={portal.name}
        />
        <div className='osw-portals-show-name'>{portal.name}</div>
        <div className='osw-portals-show-umbrella'>
          {portal.umbrella ? portal.umbrella.name : 'Umbrella'}
        </div>
        <div className='osw-portals-show-category'>{portal.category.name}</div>
        <div className='osw-portals-show-description'>
          {this.renderDescription()}
        </div>
        <ButtonRow>
          <Button href={portal.links.web}>On OrgSync.com</Button>
          {this.renderWebsiteLink()}
        </ButtonRow>
      </div>
    );
  }
});
