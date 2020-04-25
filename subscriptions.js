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
  if (!collection)
    collection = db;
  else if (typeof collection === 'string')
    collection = db.collection(collection);

  const [isPopulated, setIsPopulated] = useState(collection.populated);

  useEffect(() => {
    if (isPopulated)
      return;

    if (collection === db) {

      // the database, wait for idb collectionsPopulated event
      const update = () => {
        debug('populated', collection.name, collection.populated);
        db.idb.off('collectionsPopulated');
        setIsPopulated(true);
      };
      db.idb.on('collectionsPopulated', update);
      return () => db.idb.off('collectionsPopulated', update);

    } else {

      // a collection, watch it.
      const cs = collection.watch();
      cs.on('populateEnd', () => {
        debug('populated', collection.name, collection.populated)
        cs.close();
        setIsPopulated(true);
      });
      return () => cs.close();

    }
  }, []);

  return isPopulated;
}

function IsPopulated(props) {
  // TODO, could pass initTime to children for UI hints on slow loading
  const match = props.match !== false;
  const isPopulated = useGongoIsPopulated(props.collection);
  return isPopulated === match ? props.children : null;
}

module.exports = {
  __esModule: true,
  useGongoSub,
  useGongoIsPopulated,
  IsPopulated,
}
