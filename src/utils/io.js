import config from '../config';
import Live from 'live-socket';

const live = new Live(config.live);
const queue = [];
let authorized = false;

live.emit = (...args) => {
  if (authorized) return live.send(...args);
  queue.push(args);
  return live;
};

const auth = () => {
  authorized = false;
  live.send('auth', config.api.key, handleAuth);
};

const handleAuth = () => {
  authorized = true;
  let args;
  while (args = queue.shift()) live.emit(...args);
};

auth();
live.on('close', auth);

export default live;
