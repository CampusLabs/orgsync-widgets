import Cursors from 'cursors';
import Icon from 'components/icon';
import React from 'react';

import {getIconName, getName} from 'entities/selector/item';

export default React.createClass({
  mixins: [Cursors],

  getClassName: function () {
    return 'osw-selector-token osw-selector-token-type-' +
      getIconName(this.props.item);
  },

  render: function () {
    return (
      <div className={this.getClassName()}>
        <div className='osw-selector-token-content'>
          <Icon
            className='osw-selector-token-remove'
            name='delete'
            onClick={this.props.onRemoveClick}
          />
          <div className='osw-selector-token-name'>
            <Icon
              className='osw-selector-token-icon'
              name={getIconName(this.props.item)}
            />
            {getName(this.props.item)}
          </div>
        </div>
      </div>
    );
  }
});
