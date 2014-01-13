import {Model} from 'backbone';

export default {
  getInitialState: function () {
    return {isLoading: false, error: null};
  },

  componentWillMount: function () {
    this.getBackboneModels().forEach(function (model) {
      model.on({
        'add change remove': this.forceUpdate.bind(this, null),
        request: this.handleRequest,
        sync: this.handleSync,
        error: this.handleError
      }, this);
    }, this);
  },

  handleRequest: function (model) {
    model[(model instanceof Model ? 'is' : 'are') + 'Fetched'] = true;
    this.setState({isLoading: true, error: null});
  },

  handleSync: function (model) {
    this.setState({isLoading: false, error: null});
  },

  handleError: function (model, er) {
    model[(model instanceof Model ? 'is' : 'are') + 'Fetched'] = false;
    this.setState({isLoading: false, error: er.toString()});
  },

  componentWillUnmount: function () {
    this.getBackboneModels().forEach(function (model) {
      model.off(null, null, this);
    }, this);
  }
};
