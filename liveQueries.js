const { default: React, useState, useEffect } = require('react');
const { debug } = require('./utils');

function useGongoLive(cursorFunc, opts = {}) {
  if (typeof cursorFunc !== 'function')
    throw new Error("useGongoLive expects a function that returns a cursor, "
      + "not " + JSON.stringify(cursorFunc));

  const [cursorOrResults, setData] = useState(cursorFunc);
  useEffect(() => {
    return function cleanup() {
      const cursor = cursorOrResults; // only run once, so initial value
      cursor.unwatch();
    }
  }, []);

  // TODO, check if user supplied a func that returns an array?  run twice?
  if (Array.isArray(cursorOrResults))
    return cursorOrResults;

  // This part will only get run once on mount

  const cursor = cursorOrResults;
  debug('useGongoLive cursor', cursor);

  if (typeof cursor !== 'object' || !cursor.constructor || cursor.constructor.name !== 'Cursor')
    throw new Error("useGongoLive function should return a cursor, not "
      + "not " + JSON.stringify(cursor));

  let data = cursor.watch(change => {
    debug('useGongoLive change', change);

    // TODO we should be smarter about what changes to listen to
    // but for now a simple compare will suffice
    const next = cursor.toArraySync();
    for (let i=0; i < next.length; i++)
      if (data[i] !== next[i])
        return;

    data = next;
    setData(data);
    //setData(cursor.toArraySync())
  }, { debounce: opts.debounce });

  return data;

  /*
  const changeStream = cursor.watch();
  changeStream.on('change', debounce(change => {
    debug('useGongoLive change', change);
    setData(cursor.toArraySync())
  }, opts.debounce));

  return cursor.toArraySync();
  */
}

function useGongoOne(origCursorFunc, opts) {
  const cursorFunc = () => origCursorFunc().limit(1);
  const data = useGongoLive(cursorFunc, opts);
  return data[0];
}

function useGongoUserId(db, opts) {
  const cursorFunc = () => db.gongoStore.find({_id: 'auth'}).limit(1);
  const data = useGongoLive(cursorFunc, opts);
  return data[0] && data[0].userId;
}

module.exports = {
  __esModule: true,
  useGongoLive,
  useGongoOne,
  useGongoUserId,
};
