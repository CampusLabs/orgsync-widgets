import config from 'config';
import Live from 'live';

const io = new Live(config.live);
const queue = [];
let authorized = false;

const send = (...args) => {
  if (authorized) return io.send(...args);
  queue.push(args);
  return io;
};

const auth = () => {
  authorized = false;
  io.send('auth', config.api.key, handleAuth);
};

const handleAuth = () => {
  authorized = true;
  let args;
  while (args = queue.shift()) send(...args);
};

auth();
io.on('close', auth);

export default {off: ::io.off, on: ::io.on, send};
