export default {
  componentWillMount: function () {
    var props = this.props;
    var expectedProps = this.getExpectedProps();
    for (var name in expectedProps) {
      var definition = expectedProps[name];
      if (props[name]) {
        if (props[name] instanceof definition.type) continue;
        props[name] = new definition.type(props[name]);
      } else {
        for (var alternateProp in definition.alternates) {
          if (!props[alternateProp]) continue;
          props[name] = definition.alternates[alternateProp];
        }
      }
    }
  }
};
