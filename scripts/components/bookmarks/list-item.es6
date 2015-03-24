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

  getInitialState: function() {
    return {
      showIsOpen: false
    };
  },

  openShow: function (ev) {
    this.update({showIsOpen: {$set: true}});
  },

  closeShow: function () {
    this.update({showIsOpen: {$set: false}});
  },

  renderShow: function () {
    if (!this.state.showIsOpen) return;
    return (
      <Show
        {...this.props}
        cursors={{bookmark: this.getCursor('bookmark')}}
      />
    );
  },

  renderShowPopup: function() {
    return (
      <Popup
        close={this.closeShow}
        name='bookmarks-show'
        title='Bookmark Details'>
        {this.renderShow()}
      </Popup>
    );
  },

  render: function () {
    var bookmark = this.state.bookmark;
    return (
      <div className='osw-bookmarks-list-item'>
        <div style={{ float: 'left' }}>
          <img src={`https://www.google.com/s2/favicons?domain_url=${bookmark.url}`}/>
        </div>

        <div style={{ marginLeft: '25px' }}>
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