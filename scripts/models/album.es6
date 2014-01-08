import Model from 'models/model';

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

Album.Collection = Model.Collection.extend({
  model: Album
});
  
export default = Album;
