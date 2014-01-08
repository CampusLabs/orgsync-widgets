import {Model, Collection} from 'models/base';

var Album = Model.extend({
  relations: {
    portal: {hasOne: 'portal', fk: 'portal_id'},
    photos: {hasMany: 'photo', fk: 'album_id'}
  },

  orgsyncUrl: function () {
    return 'https://orgsync.com/' + this.get('portal').id +
      '/photos/albums/' + this.id;
  }
});

Album.Collection = Collection.extend({
  model: Album
});
  
export default = Album;
