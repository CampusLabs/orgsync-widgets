import {Model, Collection} from 'models/base';

var Community = Model.extend({
  relations: {
    portals: {hasMany: 'portal', fk: 'community_id'},
    umbrellas: {hasMany: 'portal', fk: 'community_id'},
    categories: {hasMany: 'category', fk: 'community_id'},
    events: {hasMany: 'event', via: 'portals', fk: 'portal_id'}
  },
  
  urlRoot: '/communities'
});

Community.Collection = Collection.extend({
  model: Community,

  url: '/communities'
});

export default = Community;
