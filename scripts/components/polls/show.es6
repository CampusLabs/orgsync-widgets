import _ from 'underscore';
import api from 'api';
import Button from 'components/ui/button';
import ButtonRow from 'components/ui/button-row';
import Cursors from 'cursors';
import moment from 'moment';
import React from 'react';
import Results from 'components/polls/results';

var FORMAT = 'MMM D, YYYY';

export default React.createClass({
  mixins: [Cursors],

  getInitialState() {
    return {
      isLoading: false,
      error: null
    };
  },

  componentWillMount() {
    var poll = this.state.poll;
    if (poll.description != null) return;
    this.update({isLoading: {$set: true}, error: {$set: null}});
    api.get(
      '/portals/:portal_id/polls/:id',
      {portal_id: this.props.portalId, id: poll.id},
      this.handleFetch
    );
  },

  handleFetch(er, res) {
    var deltas = {isLoading: {$set: false}};
    if (er) deltas.error = {$set: er};
    else deltas.poll = {$set: res.data};
    this.update(deltas);
  },

  formatDate(dateString) {
    return moment(dateString).format(FORMAT);
  },

  renderCreator(poll) {
    if (!poll.creator) return;
    return <p>Created by {poll.creator.display_name}</p>
  },

  renderResults(poll) {
    if (poll.can_view_results === undefined) return;
    return <Results poll={poll} />;
  },

  renderStatus(poll) {
    if (poll.begins_at !== undefined && !poll.is_open) {
      var start = this.formatDate(poll.begins_at);
      var end = this.formatDate(poll.ends_at);
      return <p>{`This poll was open from ${start} to ${end}`}</p>;
    }
  },

  renderVoted(poll) {
    if (poll.has_voted) return <p>You have voted on this poll.</p>;
  },

  render() {
    var poll = this.state.poll;

    return (
      <div className='osw-polls-show'>
        <h3>{poll.name}</h3>

        {this.renderStatus(poll)}
        {this.renderCreator(poll)}
        {this.renderVoted(poll)}
        {this.renderResults(poll)}

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
