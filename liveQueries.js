const { default: React, useState, useEffect } = require('react');
const gongoDb = require('gongo-client');

const { debug } = require('./utils');

function useGongoLive(cursorFunc, opts = {}) {
  if (typeof cursorFunc !== 'function')
    throw new Error("useGongoLive expects a function that returns a cursor, "
      + "not " + JSON.stringify(cursorFunc));

  const cursor = cursorFunc.call(null, gongoDb);
  const slug = cursor.slug();

  // 1st run: cursor, 2nd run: results (from setData)
  const [previouslySetData, setData] = useState(null);

  useEffect(() => {
    debug('useGongoLive ' + cursor.collection.name, JSON.stringify(cursor._query));

    cursor.watch(newData => {
      debug('useGongoLive change', newData);
      setData(newData);
    }, { debounce: opts.debounce });

    return () => setData(null) && cursor.unwatch();
  }, [ slug ]);

  return previouslySetData || cursor.toArraySync();

  /*

  // TODO, check if user supplied a func that returns an array?  run twice?
  if (Array.isArray(cursorOrResults))
    return cursorOrResults;

  // This part will only get run once on first call, before setData called
  return cursorOrResults.toArraySync();

  if (typeof cursor !== 'object' || !cursor.constructor || cursor.constructor.name !== 'Cursor')
    throw new Error("useGongoLive function should return a cursor, not "
      + "not " + JSON.stringify(cursor));

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
