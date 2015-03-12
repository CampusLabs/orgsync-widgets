import _ from 'underscore';
import api from 'api';
import Button from 'components/ui/button';
import ButtonRow from 'components/ui/button-row';
import Cursors from 'cursors';
import React from 'react';
import Results from 'components/polls/results';

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
    api.get(
      '/portals/:portal_id/polls/:id',
      {portal_id: this.props.portalId, id: poll.id},
      this.handleFetch
    );
  },

  handleFetch: function (er, res) {
    var deltas = {isLoading: {$set: false}};
    if (er) deltas.error = {$set: er};
    else deltas.poll = {$set: res.data};
    this.update(deltas);
  },

  render: function () {
    var poll = this.state.poll;
    return (
      <div className='osw-polls-show'>
        <h3>{poll.name}</h3>
        <p>Created by {poll.creator.display_name}</p>
        <p>{poll.description}</p>

        <Results responses={this.state.poll.poll_options} />

        <div className="osw-button-row">
          <ButtonRow>
            <Button href={poll.links.web} target='_parent'>
              View on OrgSync.com
            </Button>
          </ButtonRow>
        </div>
      </div>
    );
  }
});
