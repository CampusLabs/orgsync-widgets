import {Model} from 'backbone';

export default {
  getInitialState: function () {
    return {loadCount: 0, error: null};
  },

  componentWillMount: function () {
    this.getBackboneModels().forEach(function (model) {
      model.on({
        'add change remove': this.forceUpdate.bind(this, null),
        request: this.onRequest,
        sync: this.onSync,
        error: this.onError
      }, this);
    }, this);
  },

  onRequest: function (model) {
    model[(model instanceof Model ? 'is' : 'are') + 'Fetched'] = true;
    this.setState({loadCount: this.state.loadCount + 1, error: null});
  },

  onSync: function () {
    this.setState({loadCount: this.state.loadCount - 1, error: null});
  },

  onError: function (model, er) {
    model[(model instanceof Model ? 'is' : 'are') + 'Fetched'] = false;
    this.setState({loadCount: this.state.loadCount - 1, error: er.toString()});
  },

  componentWillUnmount: function () {
    this.getBackboneModels().forEach(function (model) {
      model.off(null, null, this);
    }, this);
  }
};
