import api from 'api';
import Button from 'components/ui/button';
import ButtonRow from 'components/ui/button-row';
import CreatedBy from 'components/shared/created-by';
import Cursors from 'cursors';
import LoadingSpinner from 'components/ui/loading-spinner';
import moment from 'moment';
import React from 'react';
import Results from 'components/polls/results';

var FORMAT = 'MMM D, YYYY';

export default React.createClass({
  mixins: [Cursors],

  propTypes: {
    portalId: React.PropTypes.number
  },

  getInitialState: function () {
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

  renderContent(poll) {
    if (this.state.isLoading) return <LoadingSpinner />;
    return (
      <div>
        {this.renderStatus(poll)}
        {this.renderCreator(poll)}
        {this.renderVoted(poll)}
        {this.renderResults(poll)}
      </div>
    );
  },

  renderCreator(poll) {
    if (poll.creator === undefined) return;
    return <CreatedBy account={poll.creator} createdAt={poll.created_at} />;
  },

  renderLink(poll) {
    if (poll.links === undefined) return;
    return (
      <Button href={poll.links.web}>
        View on OrgSync.com
      </Button>
    );
  },

  renderResults(poll) {
    if (poll.can_view_results === undefined) return;
    return <Results poll={poll} />;
  },

  renderStatus(poll) {
    if (poll.begins_at !== undefined && !poll.is_open) {
      let start = this.formatDate(poll.begins_at);
      let end = this.formatDate(poll.ends_at);
      return <p>{`This poll was open from ${start} to ${end}`}</p>;
    }
  },

  renderVoted(poll) {
    if (poll.has_voted) return <p>You have voted on this poll.</p>;
  },

  render() {
    const {poll} = this.state;

    return (
      <div className='osw-polls-show'>
        <h3>{poll.name}</h3>

        {this.renderContent(poll)}

        <div className='osw-button-row'>
          <ButtonRow>
            {this.renderLink(poll)}
          </ButtonRow>
        </div>
      </div>
    );
  }
});
