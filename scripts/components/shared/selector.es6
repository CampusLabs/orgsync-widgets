import Cursors from 'cursors';
import joinClassNames from 'utils/join-class-names';
import React from 'react';

export default React.createClass({
  mixins: [Cursors],

  propTypes: {
    className: React.PropTypes.string,
    name: React.PropTypes.string,
    onChange: React.PropTypes.func.isRequired,
    renderOptions: React.PropTypes.func.isRequired,
    value: React.PropTypes.string
  },

  render: function () {
    var options = this.props.renderOptions();
    var value = this.props.value;
    if (options.length === 2) value = options[1].props.value;
    return (
      <div
        {...this.props}
        className={
          joinClassNames(
            'osw-big osw-field oswi osw-dropdown',
            this.props.className
          )
        }
      >
        <select
          name={this.props.name}
          value={value}
          onChange={this.props.onChange}
        >
          {options}
        </select>
      </div>
    );
  }
});
