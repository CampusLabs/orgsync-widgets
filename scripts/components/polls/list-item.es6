import Cursors from 'cursors';
import moment from 'moment';
import Popup from 'components/ui/popup';
import React from 'react';
import Sep from 'components/ui/sep';
import Show from 'components/polls/show';

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
    return <Show cursors={{poll: this.getCursor('poll')}} />;
  },

  renderShowPopup: function() {
    return (
      <Popup
        close={this.closeShow}
        name='polls-show'
        title='Poll Details'>
        {this.renderShow()}
      </Popup>
    );
  },

  render: function () {
    var poll = this.state.poll;
    return (
      <div className='osw-polls-list-item'>
        <div className='osw-polls-list-item-info' style={{ float: 'left' }}>
          <div className="osw-polls-box-wrapper">
            <div className="osw-polls-box-number">{poll.votes}</div>
            <div className="osw-polls-box-footer">Votes</div>
          </div>
          <div className='osw-polls-list-item-name' onClick={this.openShow}>
            {poll.name}
          </div>
        </div>
        <div className='osw-polls-status' onClick={this.openShow}>
          <p>VOTE NOW</p>
        </div>
        {this.renderShowPopup()}
      </div>
    );
  }
});
