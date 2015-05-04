import api from 'api';
import Button from 'components/ui/button';
import ButtonRow from 'components/ui/button-row';
import Cursors from 'cursors';
import FormattedText from 'formatted-text';
import LoadingSpinner from 'components/ui/loading-spinner';
import moment from 'moment';
import React from 'react';

var FORMAT = 'MMM D, YYYY';

export default React.createClass({
  mixins: [Cursors],

  getInitialState() {
    return {
      isLoading: false,
      error: null
    };
  },

  componentWillMount() {
    var bookmark = this.state.bookmark;
    if (bookmark.description != null) return;
    this.update({isLoading: {$set: true}, error: {$set: null}});
    api.get(
      '/portals/:portal_id/links/:id',
      {portal_id: this.props.portalId, id: bookmark.id},
      this.handleFetch
    );
  },

  handleFetch(er, res) {
    var deltas = {isLoading: {$set: false}};
    if (er) deltas.error = {$set: er};
    else deltas.bookmark = {$set: res.data};
    this.update(deltas);
  },

  formatDate(dateString) {
    return moment(dateString).format(FORMAT);
  },

  renderDescription(bookmark) {
    const description = bookmark.description;
    if (description === undefined) return <LoadingSpinner />;
    return (
      <FormattedText>
        {description}
      </FormattedText>
    );
  },

  renderLink(bookmark) {
    return <Button href={bookmark.links.web}>Visit link</Button>;
  },

  render() {
    const {bookmark} = this.state;
    return (
      <div className='osw-bookmarks-show'>
        <div className='osw-bookmarks-favicon'>
          <img src={`https://www.google.com/s2/favicons?domain_url=${bookmark.links.web}`}/>
        </div>

        <div style={{marginLeft: '25px'}}>
          <div className='osw-bookmarks-show-name'>
            {bookmark.name}
          </div>

          <div className='osw-bookmarks-show-description'>
            {this.renderDescription(bookmark)}
          </div>
        </div>

        <div className='osw-button-row'>
          <ButtonRow>
            {this.renderLink(bookmark)}
          </ButtonRow>
        </div>
      </div>
    );
  }
});
