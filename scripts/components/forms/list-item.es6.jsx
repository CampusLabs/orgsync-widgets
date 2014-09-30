/** @jsx React.DOM */

import Cursors from 'cursors';
import Popup from 'components/popup';
import React from 'react';
import Show from 'components/forms/show';

export default React.createClass({
  mixins: [Cursors],

  getInitialState: function() {
    return {
      showIsOpen: false
    };
  },

  handleClick: function (ev) {
    if (this.props.redirect) return;
    ev.preventDefault();
    this.update({showIsOpen: {$set: true}});
  },

  closeShow: function () {
    this.update({showIsOpen: {$set: false}});
  },

  truncate: function(str) {
    var charLimit = 30;
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

  render: function () {
    var form = this.state.form;
    return (
      <div className='osw-forms-list-item'>
        <div className='osw-forms-list-item-inner'>
          <a href={form.links.web} onClick={this.handleClick}>
            <div className='osw-forms-icon'>
              <img src={form.important ? 'pin.png' : ''} />
            </div>
            <div className='osw-forms-name'>
              {this.truncate(form.name)}
            </div>
            <div className='osw-forms-category-name'>
              {form.category.name}
            </div>
            <div className='osw-forms-creator'>
              <div className='osw-forms-creator-name'>
                {form.creator.display_name}
              </div>
            </div>
            </a>
            {this.renderShowPopup()}
        </div>
      </div>
    );
  }
});
