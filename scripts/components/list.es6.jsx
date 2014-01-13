/** @jsx React.DOM */

export default React.createClass({
  render: function () {
    return (
      <div className='albums-index'>
        {this.listItems()}
        {this.state.loadCount ? <LoadingSpinner /> : null}
        {this.state.error ? this.state.error : null}
      </div>
    );
  }
});
