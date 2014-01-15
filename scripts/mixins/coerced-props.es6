export default {
  componentWillMount: function () {
    var props = this.props;
    var coercedProps = this.getCoercedProps();
    for (var name in coercedProps) {
      var definition = coercedProps[name];
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
