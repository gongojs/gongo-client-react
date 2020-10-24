const React = require('react');
const { useState, useEffect } = React;
const gongoDb = require('gongo-client');

const { debug } = require('./utils');

function useGongoCursor(cursorFunc, opts = {}) {
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

    return function cleanUp() { setData(null); cursor.unwatch() };
  }, [ slug ]);

  return /* previouslySetData || */ cursor;
}

function useGongoLive(cursorFunc, opts) {
  const cursor = useGongoCursor(cursorFunc, opts);
  return cursor.toArraySync();
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
  useGongoCursor,
  useGongoLive,
  useGongoOne,
  useGongoUserId,
};
