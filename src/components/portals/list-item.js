import Cursors from 'cursors';
import Popup from '../ui/popup';
import React from 'react';
import Show from './show';

var DEFAULT_SRC = 'https://orgsync.com/assets/icons/portals/no_org_profile_150.png';

export default React.createClass({
  mixins: [Cursors],

  getInitialState: function () {
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

  getFittedName: function () {
    var name = this.state.portal.name;
    return name.length > 80 ? this.state.portal.short_name : name;
  },

  getUmbrellaName: function () {
    var portal = this.state.portal;
    return portal.umbrella ? portal.umbrella.name : 'Umbrella';
  },

  getSrc: function () {
    return this.state.portal.picture_url || DEFAULT_SRC;
  },

  renderShowPopup: function () {
    if (!this.state.showIsOpen) return;
    return (
      <Popup name='portals-show' close={this.closeShow} title='Portal Details'>
        <Show cursors={{portal: this.getCursor('portal')}} />
      </Popup>
    );
  },

  render: function () {
    var portal = this.state.portal;
    return (
      <div className='osw-portals-list-item'>
        <a href={portal.links.web} onClick={this.handleClick}>
          <div className='osw-portals-list-item-picture'>
            <img alt='' src={this.getSrc()} />
          </div>
          <div className='osw-portals-list-item-info'>
            <div className='osw-portals-list-item-name'>
              {this.getFittedName()}
            </div>
            <div className='osw-portals-list-item-umbrella'>
              {this.getUmbrellaName()}
            </div>
            <div className='osw-portals-list-item-category'>
              {portal.category.name}
            </div>
          </div>
        </a>
        {this.renderShowPopup()}
      </div>
    );
  }
});
