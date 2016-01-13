import Cursors from 'cursors';
import Popup from '../ui/popup';
import React from 'react';
import Show from './show';

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

  renderShowPopup: function() {
    if (!this.state.showIsOpen) return;
    return (
      <Popup
        close={this.closeShow}
        name='polls-show'
        title='Poll Details'
      >
        <Show {...this.props} cursors={{poll: this.getCursor('poll')}} />
      </Popup>
    );
  },

  renderStatusText: function(poll) {
    if (poll.is_open) {
      if (poll.has_voted) return <p className='voted'>VOTED</p>;
      return <p className='vote-now'>VOTE NOW</p>;
    } else {
      return <p className='closed'>CLOSED</p>;
    }
  },

  renderStatusLink: function(poll) {
    if (this.props.limit) return;
    return (
      <div className='osw-polls-status' onClick={this.openShow}>
        {this.renderStatusText(poll)}
      </div>
    );
  },

  renderVoteCount: function(poll) {
    if (poll.vote_count > 999) return "999+";
    return poll.vote_count;
  },

  renderPollBox: function(poll) {
    return (
      <div className="osw-polls-box-wrapper">
        <div className="osw-polls-box-number">{this.renderVoteCount(poll)}</div>
        <div className="osw-polls-box-footer">{poll.vote_count === 1 ? 'Vote' : 'Votes'}</div>
      </div>
    );
  },

  renderBorderClass: function() {
    return this.props.limit ? 'osw-polls-no-border' : '';
  },

  render: function () {
    var poll = this.state.poll;
    return (
      <div className={`osw-polls-list-item ${this.renderBorderClass()}`}>
        <div className='osw-polls-list-item-info' style={{ float: 'left' }}>
          {this.renderPollBox(poll)}
          <div className='osw-polls-list-item-name' onClick={this.openShow}>
            {poll.name}
          </div>
        </div>
        {this.renderStatusLink(poll)}
        {this.renderShowPopup()}
      </div>
    );
  }
});
