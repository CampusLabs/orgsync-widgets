import api from 'api';
import Button from 'components/ui/button';
import ButtonRow from 'components/ui/button-row';
import Cursors from 'cursors';
import React from 'react';

export default React.createClass({
  mixins: [Cursors],

  getInitialState: function () {
    return {
      isLoading: false,
      error: null
    };
  },

  componentWillMount: function () {
    var poll = this.state.poll;
    if (poll.description != null) return;
    this.update({isLoading: {$set: true}, error: {$set: null}});
  },

  handleFetch: function (er, res) {
    var deltas = {isLoading: {$set: false}};
    if (er) deltas.error = {$set: er};
    else deltas.form = {$set: res.data};
    this.update(deltas);
  },

  showCreator: function(form) {
    return (
      "Created by " + form.creator.display_name
    );
  },

  renderDescription: function(description) {
    if(!description || /^\s*$/.test(description)) return 'No description provided';
    return (description);
  },

  renderResults: function() {
  },

  render: function () {
    var poll = this.state.poll;
    return (
      <div className='osw-polls-show'>
        <h3>{poll.name}</h3>
        <p>{poll.description}</p>
        {this.renderResults()}
      </div>
    );
  }
});
