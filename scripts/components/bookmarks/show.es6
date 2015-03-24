import _ from 'underscore';
import api from 'api';
import Button from 'components/ui/button';
import ButtonRow from 'components/ui/button-row';
import Cursors from 'cursors';
import moment from 'moment';
import React from 'react';

var FORMAT = 'MMM D, YYYY';

export default React.createClass({
  mixins: [Cursors],

  getInitialState: function () {
    return {
      isLoading: false,
      error: null
    };
  },

  componentWillMount: function () {
    var bookmark = this.state.bookmark;
    if (bookmark.description != null) return;
    this.update({isLoading: {$set: true}, error: {$set: null}});
    api.get(
      '/portals/:portal_id/links/:id',
      {portal_id: this.props.portalId, id: bookmark.id},
      this.handleFetch
    );
  },

  handleFetch: function (er, res) {
    var deltas = {isLoading: {$set: false}};
    if (er) deltas.error = {$set: er};
    else deltas.bookmark = {$set: res.data};
    this.update(deltas);
  },

  formatDate: function(dateString) {
    return moment(dateString).format(FORMAT);
  },

  renderDescription: function(desc) {
    if (desc === undefined) return;
    return desc.replace(/(\r\n|\n|\r)/g,"<br />");
  },

  render: function () {
    var bookmark = this.state.bookmark;
    return (
      <div className='osw-bookmarks-show'>
        <div className='osw-bookmarks-favicon'>
          <img src={`https://www.google.com/s2/favicons?domain_url=${bookmark.url}`}/>
        </div>
        <div style={{ marginLeft: '25px' }}>
          <div className='osw-bookmarks-show-name'>
            {bookmark.name}
          </div>
          <div
            className='osw-bookmarks-show-description'
            dangerouslySetInnerHTML={{__html: this.renderDescription(bookmark.description)}}
          />
        </div>
        <div className='osw-button-row'>
          <ButtonRow>
            <Button href={bookmark.url} target='_parent'>
              Visit link
            </Button>
          </ButtonRow>
        </div>
      </div>
    );
  }
});
