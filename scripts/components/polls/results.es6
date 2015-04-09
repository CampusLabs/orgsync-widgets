import _ from 'underscore';
import Cursors from 'cursors';
import React from 'react';

export default React.createClass({
  mixins: [Cursors],

  propTypes: {
    poll: React.PropTypes.shape({
      poll_options: React.PropTypes.array.isRequired,
      can_view_results: React.PropTypes.bool.isRequired,
      votes: React.PropTypes.object.isRequired
    }).isRequired
  },

  getInitialState() {
    return {
      sortedByVotes: false
    };
  },

  percentageOfLeader(votes, maxWidth) {
    var maxVotes = this.getPollVotesCount(
      _.max(this.props.poll.poll_options, (response) => {
        return this.getPollVotesCount(response)
      })
    );
    return this.calculatePercentage(votes, maxVotes, maxWidth, 0);
  },

  calculatePercentage(votes, maxVotes, maxWidth, minWidth) {
    if (votes === 0) {
      return minWidth + "%";
    } else {
      return parseInt(votes / maxVotes * (maxWidth - minWidth) + minWidth) + "%";
    }
  },

  totalVotes() {
    return _.reduce(this.props.poll.poll_options, (sum, response) => {
      return sum + this.getPollVotesCount(response);
    }, 0);
  },

  sortedResponses() {
    if (this.state.sortedByVotes) {
      return _.sortBy(this.props.poll.poll_options, this.getPollVotesCount).reverse();
    } else {
      return _.sortBy(this.props.poll.poll_options, 'id');
    }
  },

  getPollVotesCount(response) {
    return this.props.poll.votes[response.id];
  },

  renderResponses() {
    return _.map(this.sortedResponses(), (response) => {
      var pollVotesCount = this.getPollVotesCount(response);

      return (
        <tr key={response.id}>
          <td width="30%">{response.name}</td>
          <td>
            <div
              className="osw-poll-bar"
              style={{
                width: this.percentageOfLeader(pollVotesCount, 88)
              }}
            ></div>
            <div className="osw-poll-bar-count">
              {pollVotesCount}
            </div>
          </td>
          <td width="7%">
            {this.calculatePercentage(pollVotesCount, this.totalVotes(), 100, 0)}
          </td>
        </tr>
      );
    });
  },

  sortOptions() {
    this.update({sortedByVotes: {$set: !this.state.sortedByVotes}});
  },

  sortButtonLabel() {
    return this.state.sortedByVotes ? 'Default' : 'Sort';
  },

  render() {
    var poll = this.props.poll;

    if (!poll.can_view_results) return (
      <p><strong>The results are hidden.</strong></p>
    );

    return (
      <div>
        <div className="osw-polls-panel-header group">
          <h4>Poll Results</h4>
          <button
            className="osw-button"
            onClick={this.sortOptions}
          >
            {this.sortButtonLabel()}
          </button>
        </div>
        <table className="osw-poll-results">
          <tbody>
            {this.renderResponses()}
          </tbody>
        </table>
      </div>
    );
  }
});
