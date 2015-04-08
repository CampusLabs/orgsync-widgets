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

  openShow(ev) {
    this.update({showIsOpen: {$set: true}});
  },

  closeShow() {
    this.update({showIsOpen: {$set: false}});
  },

  renderShow() {
    if (!this.state.showIsOpen) return;
    return (
      <Show
        {...this.props}
        cursors={{bookmark: this.getCursor('bookmark')}}
      />
    );
  },

  renderShowPopup() {
    return (
      <Popup
        close={this.closeShow}
        name='bookmarks-show'
        title='Bookmark Details'>
        {this.renderShow()}
      </Popup>
    );
  },

  render() {
    var bookmark = this.state.bookmark;
    return (
      <div className='osw-bookmarks-list-item'>
        <div className='osw-bookmarks-favicon'>
          <img src={`https://www.google.com/s2/favicons?domain_url=${bookmark.url}`}/>
        </div>

        <div className='osw-bookmarks-content'>
          <div className='osw-bookmarks-list-item-name' onClick={this.openShow}>
            {bookmark.name}
          </div>

          <div className='osw-bookmarks-list-item-description'>
            <p>{bookmark.url}</p>
          </div>
        </div>

        {this.renderShowPopup()}
      </div>
    );
  }
});
