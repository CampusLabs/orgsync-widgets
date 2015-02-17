import _ from 'underscore';
import _str from 'underscore.string';
import api from 'api';
import Cursors from 'cursors';
import React from 'react';
import WIDGETS from 'components/builder/widgets';

export default React.createClass({
  mixins: [Cursors],

  getDataAttrs: function () {
    return _.compact(_.map(_.extend({
      moduleName: WIDGETS[this.state.widget].moduleName
    }, this.state.props), (val, key) => {
      if (!val) return;
      var stringified = JSON.stringify(val).replace(/\\(.)/g, '$1');
      if (_.isString(val)) stringified = stringified.slice(1, -1);
      return `data-${_str.dasherize(key)}='${_.escape(stringified)}'`;
    }));
  },

  renderWarnings: function () {
    var key = this.state.apiKeyData;
    if (!key) return;
    var warnings = [];
    if (key.target.kind !== 'anon') {
      warnings.push('This API key may expose non-public information.');
    }
    if (warnings.length === 0) return;
    return (
      <div className='osw-selector-index-error'>
        Warning:
        <ul>
          {_.map(warnings, (w) => <li key={w}>{w}</li>)}
        </ul>
      </div>
    );
  },

  render: function () {
    return (
      <div>
        {this.renderWarnings()}
        <pre className='osw-inset-block'>{
`<link href='https://orgsync.com/assets/orgsync-widgets.css' rel='stylesheet'>
<script>window.OSW_API_KEY = '${api.key}';</script>
<script src='https://orgsync.com/assets/orgsync-widgets.js' async></script>
<div
  class='orgsync-widget'
  ${this.getDataAttrs().join('\n  ')}
></div>
`}
        </pre>
      </div>
    );
  }
});
