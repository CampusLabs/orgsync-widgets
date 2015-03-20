import _ from 'underscore';
import React from 'react';

export default React.createClass({
  propTypes: {
    responses: React.PropTypes.array
  },

  getInitialState: function() {
    return {
      sortedByVotes: false
    };
  },

  getDefaultProps: function() {
    return {
      responses: null
    };
  },

  percentageOfLeader: function(votes, maxWidth) {
    var maxVotes = _.max(this.props.responses, function(response) { return response.poll_votes_count }).poll_votes_count;
    return this.calculatePercentage(votes, maxVotes, maxWidth, 0);
  },

  calculatePercentage: function(votes, maxVotes, maxWidth, minWidth) {
    if (votes === 0) {
      return minWidth + "%";
    } else {
      return parseInt(votes / maxVotes * (maxWidth - minWidth) + minWidth) + "%";
    }
  },

  totalVotes: function() {
    return _.reduce(this.props.responses, function(sum, response) { return sum + response.poll_votes_count }, 0);
  },

  sortedResponses: function() {
    if (this.state.sortedByVotes) {
      return _.sortBy(this.props.responses, 'poll_votes_count').reverse();
    } else {
      return _.sortBy(this.props.responses, 'id');
    }
  },

  renderResponses: function() {
    var that = this;
    return _.map(this.sortedResponses(), function(response) {
      return (
        <tr key={response.id}>
          <td width="30%">{response.name}</td>
          <td>
            <div className="osw-poll-bar" style={{ width: that.percentageOfLeader(response.poll_votes_count, 88) }}></div>
            <div className="osw-poll-bar-count">{response.poll_votes_count}</div>
          </td>
          <td width="7%">{that.calculatePercentage(response.poll_votes_count, that.totalVotes(), 100, 0)}</td>
        </tr>
      );
    });
  },

  sortOptions: function() {
    this.setState({
      sortedByVotes: !this.state.sortedByVotes
    });
  },

  sortButtonLabel: function() {
    if (this.state.sortedByVotes) {
      return 'Default';
    } else {
      return 'Sort';
    }
  },

  render: function() {
    if (this.props.responses === null) return (<p><strong>The results are hidden.</strong></p>);
    return (
      <div>
        <div className="osw-polls-panel-header group">
          <h4>Poll Results</h4>
          <button className="osw-button" onClick={this.sortOptions}>{this.sortButtonLabel()}</button>
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
