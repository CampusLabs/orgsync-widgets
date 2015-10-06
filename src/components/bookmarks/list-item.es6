import _ from 'underscore';
import Cursors from 'cursors';
import moment from 'moment';
import Popup from 'components/ui/popup';
import React from 'react';
import Sep from 'components/ui/sep';
import Show from 'components/bookmarks/show';

const FORMAT = 'MMM D, YYYY';

export default React.createClass({
  mixins: [Cursors],

  propTypes: {
    key: React.PropTypes.number
  },

  getInitialState() {
    return {
      showIsOpen: false
    };
  },

  closeShow() {
    this.update({showIsOpen: {$set: false}});
  },

  getFaviconUrl(bookmark) {
    let prefix = 'https://www.google.com/s2/favicons?domain_url=';
    return `${prefix}${bookmark.links.web}`;
  },

  openShow(ev) {
    this.update({showIsOpen: {$set: true}});
  },

  renderShowPopup() {
    if (!this.state.showIsOpen) return;
    return (
      <Popup
        close={this.closeShow}
        name='bookmarks-show'
        title='Bookmark Details'
      >
        <Show
          {...this.props}
          cursors={{bookmark: this.getCursor('bookmark')}}
        />
      </Popup>
    );
  },

  render() {
    var bookmark = this.state.bookmark;
    return (
      <div className='osw-bookmarks-list-item'>
        <div className='osw-bookmarks-favicon'>
          <img src={this.getFaviconUrl(bookmark)} />
        </div>

        <div className='osw-bookmarks-content'>
          <div className='osw-bookmarks-list-item-name' onClick={this.openShow}>
            {bookmark.name}
          </div>

          <div className='osw-bookmarks-list-item-description'>
            <p>{bookmark.links.web}</p>
          </div>
        </div>

        {this.renderShowPopup()}
      </div>
    );
  }
});
