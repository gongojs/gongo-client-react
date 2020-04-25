const { default: React, useState, useEffect } = require('react');
const db = require('gongo-client');

const { debug } = require('./utils');

// copied from previous version, unchecked, may not work.
function useGongoSub(gongo, name, opts) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    debug('useGongoSub', name);
    const sub = gongo.subscribe(name, opts);
    sub.on('ready', () => {
      debug('useGongoSub subIsReady', sub.name);
      setIsReady(true);
    });
    return () => sub.stop();
  }, []);

  return isReady;
}

function useGongoIsPopulated(collection) {
  if (typeof collection === 'string')
    collection = db.collection(collection);

  const [isPopulated, setIsPopulated] = useState(collection.populated);

  useEffect(() => {
    if (isPopulated)
      return;

    const cs = collection.watch();
    debug('populated', collection.name, collection.populated)
    cs.on('populateEnd', () => { cs.close(); setIsPopulated(true) });
    return () => cs.close();
  }, []);

  return isPopulated;
}

module.exports = {
  __esModule: true,
  useGongoSub,
  useGongoIsPopulated,
}
