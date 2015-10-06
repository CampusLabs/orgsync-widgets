import ReactList from 'react-list';
import React, {Component, PropTypes} from 'react';

export default class extends Component {
  static propTypes = {
    emptyRenderer: PropTypes.func,
    error: PropTypes.instanceOf(Error),
    errorRenderer: PropTypes.func,
    fetch: PropTypes.func,
    isLoading: PropTypes.bool,
    items: PropTypes.array,
    itemRenderer: PropTypes.func,
    loadingRenderer: PropTypes.func
  }

  static defaultProps = {
    emptyRenderer: () => <div>Nothing to show.</div>,
    errorRenderer: er => <div>{er.toString()}</div>,
    isLoading: false,
    items: [],
    loadingRenderer: () => <div>Loading...</div>
  }

  state = {
    isLoaded: !this.props.fetch,
    isLoading: this.props.isLoading,
    error: this.props.error
  }

  componentDidMount() {
    this.fetch();
  }

  fetch() {
    if (this.state.isLoaded || this.isFetching || this.state.error) return;
    this.setState({isLoading: true, error: null});
    this.isFetching = true;
    this.props.fetch(::this.handleFetch);
  }

  handleFetch(er, isDone) {
    this.isFetching = false;
    this.setState({isLoaded: !er && !!isDone, isLoading: false, error: er});
  }

  renderItem(index, key) {
    const {itemRenderer, items} = this.props;
    if (index === items.length - 1) this.fetch();
    return itemRenderer(items[index], key);
  }

  render() {
    const {emptyRenderer, errorRenderer, items, loadingRenderer} = this.props;
    const {error, isLoading} = this.state;
    return (
      <div>
        <ReactList
          {...this.props}
          length={items.length}
          itemRenderer={::this.renderItem}
        />
        {
          isLoading ? loadingRenderer() :
          error ? errorRenderer(error) :
          !items.length ? emptyRenderer() :
          null
        }
      </div>
    );
  }
}
