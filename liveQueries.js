const { default: React, useState, useEffect } = require('react');
const gongoDb = require('gongo-client');

const { debug } = require('./utils');

function useGongoLive(origCursorFunc, opts = {}) {
  if (typeof origCursorFunc !== 'function')
    throw new Error("useGongoLive expects a function that returns a cursor, "
      + "not " + JSON.stringify(origCursorFunc));

  const cursorFunc = origCursorFunc.bind(null, gongoDb);
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
  debug('useGongoLive ' + cursor.collection.name, JSON.stringify(cursor._query));

  if (typeof cursor !== 'object' || !cursor.constructor || cursor.constructor.name !== 'Cursor')
    throw new Error("useGongoLive function should return a cursor, not "
      + "not " + JSON.stringify(cursor));

  let data = cursor.watch(newData => {
    debug('useGongoLive change', newData);
    setData(newData);
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
  const cursorFunc = db => origCursorFunc(db).limit(1);
  const data = useGongoLive(cursorFunc, opts);
  return data[0];
}

function useGongoUserId(opts = {}) {
  const db = opts.db || gongoDb;
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
