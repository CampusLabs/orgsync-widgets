import $ from 'jquery';
import Backbone from 'backbone-pristine';
import module from 'module';

Backbone.$ = $;

// This is for compat with current-gen AMD.
module.exports = Backbone;

// In the future it will be...
// export default Backbone;
