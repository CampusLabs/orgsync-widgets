import Cursors from 'cursors';
import Popup from 'components/ui/popup';
import React from 'react';
import Sep from 'components/ui/sep';
import Show from 'components/forms/show';

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
    return (
      <div className='osw-forms-list-item' onClick={this.openShow}>
        <div className='osw-files-list-item-left'>
          {this.renderPin()}
        </div>
        <div className='osw-forms-list-item-info'>
          <div className='osw-files-list-item-name'>{this.truncate(form.name)}</div>
          <div className='osw-files-list-item-date'>
            <span>{form.category.name}</span>
            <Sep />
            <span>{form.creator.display_name}</span>
          </div>
        </div>
        {this.renderShowPopup()}
      </div>
    );
  }
});
