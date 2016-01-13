import cx from 'classnames';
import Icon from './icon';
import React from 'react';

export default React.createClass({

  render: function () {
    const {checked, className, color, handleChange, label} = this.props;

    let style;
    if (color && checked) {
      style = {background: `#${color === 'ffffff' ? '888888' : color}`};
    }

    return (
      <label {...{className}}>
        <div
          {...{style}}
          className={cx({
            'osw-checkbox': true,
            'osw-checkbox-colored': color,
            'osw-checkbox-unchecked': !checked
          })}
        >
          <Icon name='check' />
        </div>
        <input
          {...{checked}}
          onChange={handleChange}
          style={{display: 'none'}}
          type='checkbox'
        />
        {label}
      </label>
    );
  }
});
