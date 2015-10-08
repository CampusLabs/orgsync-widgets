import _ from 'underscore';
import {Mixin} from 'cursors';
import React from 'react';
import Selector from 'components/shared/selector';

export default React.createClass({
  mixins: [Mixin],

  propTypes: {
    getFacet: React.PropTypes.func.isRequired,
    objects: React.PropTypes.array.isRequired,
    showMatchCount: React.PropTypes.bool
  },

  getDefaultProps: function() {
    return {
      showMatchCount: true
    };
  },

  toOption: function (matches, name) {
    return {id: name, name: name + this.matchCount(matches)};
  },

  matchCount: function(matches) {
    if (!this.props.showMatchCount) return '';
    return ` (${matches.length})`;
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
