import _ from 'underscore';
import api from 'api';
import Cursors from 'cursors';
import React from 'react';
import Embed from 'components/builder/embed';
import WIDGETS from 'components/builder/widgets';

const PERSIST_KEY = 'OSW_BUILDER';

const DEFAULT_STATE = {
  widget: _.keys(WIDGETS)[0],
  props: {}
};

export default React.createClass({
  mixins: [Cursors],

  getInitialState: function () {
    let state;
    try { state = JSON.parse(localStorage.getItem(PERSIST_KEY)); }
    catch (er) {}
    return _.extend({}, state || DEFAULT_STATE, {
      apiKey: api.key,
      apiKeyData: {}
    });
  },

  componentWillMount: function () {
    this.fetchApiKeyData();
  },

  componentDidUpdate: function () {
    localStorage.setItem(PERSIST_KEY, JSON.stringify(this.state));
    localStorage.setItem('OSW_API_KEY', api.key = this.state.apiKey);
  },

  handleApiKeyChange: function (ev) {
    this.update({apiKey: {$set: ev.target.value}});
    this.fetchApiKeyData();
  },

  fetchApiKeyData: function () {
    var data = this.state.apiKeyData[this.state.apiKey];
    if (!this.state.apiKey || data) return;
    api.get('/keys/me', {key: this.state.apiKey}, this.handleApiKeyDataFetch);
  },

  handleApiKeyDataFetch: function (er, res) {
    if (er) return;
    var apiKeyData = {};
    apiKeyData[this.state.apiKey] = {$set: res.data};
    this.update({apiKeyData: apiKeyData});
  },

  handleWidgetChange: function (ev) {
    this.update({widget: {$set: ev.target.value}, props: {$set: {}}});
  },

  handlePropChange: function (prop, ev) {
    var deltas = {props: {}};
    deltas.props[prop] = {$set: ev.target.value || void 0};
    this.update(deltas);
  },

  renderWidgetOptions: function () {
    return _.map(WIDGETS, (__, widget) =>
      <option key={widget}>{widget}</option>
    );
  },

  renderProps: function () {
    return _.map(WIDGETS[this.state.widget].props, prop =>
      <div key={prop}>
        {prop}<br />
        <div className='osw-field'>
          <input
            value={this.state.props[prop]}
            onChange={_.partial(this.handlePropChange, prop)}
          />
        </div>
      </div>
    );
  },

  renderPreview: function () {
    var moduleName = `components/${WIDGETS[this.state.widget].moduleName}`;
    var Component = require(moduleName);
    var props = _.reduce(this.state.props, function (props, val, key) {
      try { val = JSON.parse(val); } catch (er) {}
      props[key] = val;
      return props;
    }, {});
    var key = JSON.stringify(props);
    return <Component key={key} {...props} />;
  },

  render: function () {
    return (
      <div className='osw-builder-index'>
        <div className='osw-builder-index-left'>
          API Key<br />
          <div className='osw-field'>
            <input
              value={this.state.apiKey}
              onChange={this.handleApiKeyChange}
            />
          </div>
          Widget<br />
          <div className='osw-field osw-dropdown'>
            <select
              value={this.state.widget}
              onChange={this.handleWidgetChange}
            >
              {this.renderWidgetOptions()}
            </select>
          </div>
          {this.renderProps()}
          <Embed
            cursors={{
              apiKey: this.getCursor('apiKey'),
              apiKeyData: this.getCursor('apiKeyData', this.state.apiKey || ''),
              widget: this.getCursor('widget'),
              props: this.getCursor('props')
            }}
          />
        </div>
        <div className='osw-builder-index-right orgsync-widget'>
          {this.renderPreview()}
        </div>
      </div>
    );
  }
});
