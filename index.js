const { default: React, useState, useEffect } = require('react');
const { Log, debounce } = require('gongo-client/lib/utils');

const log = new Log('gongo-react');

function useGongoLive(cursorFunc, opts = {}) {
  if (opts.debounce === undefined) opts.debounce = 50;

  if (typeof cursorFunc !== 'function')
    throw new Error("useGongoLive expects a function that returns a cursor, "
      + "not " + JSON.stringify(cursorFunc));

  const [cursorOrResults, setData] = useState(cursorFunc);
  useEffect(() => {
    return function cleanup() {
      const cursor = cursorOrResults; // only run once, so initial value
      corsor.unwatch();
    }
  }, []);

  // TODO, check if user supplied a func that returns an array?  run twice?
  if (Array.isArray(cursorOrResults))
    return cursorOrResults;

  // This part will only get run once on mount

  const cursor = cursorOrResults;
  log.debug('useGongoLive cursor', cursor);

  if (typeof cursor !== 'object' || !cursor.constructor || cursor.constructor.name !== 'Cursor')
    throw new Error("useGongoLive function should return a cursor, not "
      + "not " + JSON.stringify(cursor));

  const data = cursor.watch(change => {
    log.debug('useGongoLive change', change);
    setData(cursor.toArraySync())
  });

  return data;

  /*
  const changeStream = cursor.watch();
  changeStream.on('change', debounce(change => {
    log.debug('useGongoLive change', change);
    setData(cursor.toArraySync())
  }, opts.debounce));

  return cursor.toArraySync();
  */
}

// copied from previous version, unchecked, may not work.
function useGongoSub(gongo, name, opts) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    log.debug('useGongoSub', name);
    const sub = gongo.subscribe(name, opts);
    sub.on('ready', () => {
      log.debug('useGongoSub subIsReady', sub.name);
      setIsReady(true);
    });
    return () => sub.stop();
  }, []);

  return isReady;
}

module.exports = { __esModule: true, useGongoLive, useGongoSub };
