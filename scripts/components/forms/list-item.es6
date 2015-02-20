import Cursors from 'cursors';
import moment from 'moment';
import Popup from 'components/ui/popup';
import React from 'react';
import Sep from 'components/ui/sep';
import Show from 'components/forms/show';

const FORMAT = 'MMM D, YYYY';

export default React.createClass({
  mixins: [Cursors],

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

  truncate: function(str) {
    var charLimit = 50;
    if(str.length > charLimit){
      return str.substr(0,charLimit-3)+"...";
    } else {
      return str;
    }
  },

  renderShow: function () {
    if (!this.state.showIsOpen) return;
    return <Show cursors={{form: this.getCursor('form')}} />;
  },

  renderShowPopup: function() {
    return (
      <Popup
        name='forms-show'
        close={this.closeShow}
        title='Form Details'>
        {this.renderShow()}
      </Popup>
    );
  },

  renderPin: function() {
    let classes = ['osw-files-list-item-pin'];
    if (!this.state.form.important) {
      classes.push('osw-files-list-item-pin-hidden');
    }
    return <div className={classes.join(' ')} />
  },

  render: function () {
    var form = this.state.form;
    console.debug(form);
    return (
      <div className='osw-files-list-item' onClick={this.openShow}>
        <div style={{ float: 'left', padding: '10px' }}>
          {this.renderPin()}
        </div>
        <div className='osw-files-list-item-info' style={{ float: 'left' }}>
          <div className='osw-files-list-item-name'>
            {this.truncate(form.name)}
            <Sep />
            <span className='osw-forms-list-item-category'>{form.category.name}</span>
          </div>
          <div className='osw-files-list-item-date'>
            <span>{moment(form.last_activity_at).format(FORMAT)}</span>
          </div>
        </div>
        {this.renderShowPopup()}
      </div>
    );
  }
});
