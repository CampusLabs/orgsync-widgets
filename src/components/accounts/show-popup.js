import AccountsShow from 'components/accounts/show';
import Cursors from 'cursors';
import Icon from 'components/ui/icon';
import React from 'react';

export default React.createClass({
  mixins: [Cursors],

  handleCloseClick: function (ev) {
    this.props.close();
    ev.stopPropagation();
  },

  render: function () {
    return (
      <div className='osw-accounts-show-popup'>
        <Icon
          name='delete'
          className='osw-accounts-show-popup-close-button'
          onClick={this.handleCloseClick}
        />
        <AccountsShow {...this.props} />
      </div>
    );
  }
});
