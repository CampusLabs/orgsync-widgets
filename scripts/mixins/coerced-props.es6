export default {
  coerceProps: function () {
    if (this.propsAreCoerced) return;
    this.propsAreCoerced = true;
    var props = this.props;
    var coercedProps = this.getCoercedProps();
    for (var name in coercedProps) {
      var definition = coercedProps[name];
      if (props[name] != null) {
        if (props[name] instanceof definition.type) continue;
        props[name] = new definition.type(props[name]);
      } else if (definition.alternates) {
        for (var alternateProp in definition.alternates) {
          if (props[alternateProp] == null) continue;
          props[name] = definition.alternates[alternateProp];
        }
      }
    }
  },

  getInitialState: function () {
    this.coerceProps();
    return {};
  },

  componentWillMount: function () {
    this.coerceProps();
  }
};
