import {Mixin} from 'cursors';
import Icon from 'components/ui/icon';
import React from 'react';

import {getIconName, getDisplayName} from 'entities/selector/item';

export default React.createClass({
  mixins: [Mixin],

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
            {getDisplayName(this.props.item)}
          </div>
        </div>
      </div>
    );
  }
});
