import _ from 'underscore';
import Cursors from 'cursors';
import React from 'react';
import Selector from 'components/selector';

export default React.createClass({
  mixins: [Cursors],

  toOption: function (matches, name) {
    return {id: name, name: name + ' (' + matches.length + ')'};
  },

  renderOption: function (option) {
    return <option key={option.id} value={option.id}>{option.name}</option>;
  },

  renderOptions: function () {
    return [{id: '', name: this.props.allOption}].concat(
      _.chain(this.props.objects)
        .map(this.props.getFacet)
        .groupBy()
        .map(this.toOption)
        .sortBy('name')
        .value()
    ).map(this.renderOption);
  },

  render: function () {
    return <Selector {...this.props} renderOptions={this.renderOptions} />;
  }
});
