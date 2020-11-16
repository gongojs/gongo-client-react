const React = require('react');
const { useState, useEffect, useMemo } = React;
const gongoDb = require('gongo-client');

const { debug } = require('./utils');

function useGongoCursor(cursorFunc, opts = {}) {
  if (typeof cursorFunc !== 'function')
    throw new Error("useGongoLive expects a function that returns a cursor, "
      + "not " + JSON.stringify(cursorFunc));

  // If our cursorFunc has same hash as last call,
  // use the previously created cursor (which might have cached results).
  const newCursor = cursorFunc && cursorFunc.call(null, gongoDb);
  const slug = newCursor && newCursor.slug();
  const cursor = useMemo(() => newCursor, [slug]);

  // But, even if we re-use old cursor, make sure it reflects any
  // changed skip, limit from the new cursor.
  if (newCursor && !(newCursor._skip === cursor.skip && newCursor._limit === cursor._limit)) {
    cursor._skip = newCursor._skip;
    cursor._limit = newCursor._limit;
  }

  // 1st run: cursor, 2nd run: results (from setData)
  const [previouslySetData, setData] = useState(null);

  useEffect(() => {
    debug('useGongoLive ' + cursor.collection.name, JSON.stringify(cursor._query));

    cursor &&
    cursor.watch(newData => {
      debug('useGongoLive change', newData);
      setData(newData);
    }, { debounce: opts.debounce });

    return cursor ? function cleanUp() { setData(null); cursor.unwatch() } : undefined;
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
