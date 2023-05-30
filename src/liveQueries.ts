import { useState, useEffect, useMemo } from "react";
import gongoDb, { Database, Cursor } from "gongo-client";
import type { Document } from "gongo-client";

import { debug } from "./utils";

interface useGongoCursorOpts {
  debounce?: number;
}

type CursorFunc<DocType extends Document> = (db: Database) => Cursor<DocType>;

//function useGongoCursor(cursorFunc: CursorFunc, opts = {}) {
const useGongoCursor = <DocType extends Document>(
  cursorFunc: CursorFunc<DocType> | null | undefined | false,
  opts?: useGongoCursorOpts
) => {
  const _opts = opts || {};
  if (cursorFunc && typeof cursorFunc !== "function")
    throw new Error(
      "useGongoLive expects a function that returns a cursor, " +
        "not " +
        JSON.stringify(cursorFunc)
    );

  // If our cursorFunc has same hash as last call,
  // use the previously created cursor (which might have cached results).
  const newCursor = cursorFunc && cursorFunc.call(null, gongoDb);
  const slug = newCursor && newCursor.slug();
  const cursor = useMemo(() => newCursor, [slug]);

  // But, even if we re-use old cursor, make sure it reflects any
  // changed skip, limit from the new cursor.
  if (
    newCursor &&
    cursor &&
    // BUG FIX from: newCursor._skip === cursor.skip (not _skip)... untested!
    !(newCursor._skip === cursor._skip && newCursor._limit === cursor._limit)
  ) {
    cursor._skip = newCursor._skip;
    cursor._limit = newCursor._limit;
  }

  // 1st run: cursor, 2nd run: results (from setData)
  const [_previouslySetData, setData] = useState<null | Document[]>(null);

  useEffect(() => {
    if (!cursor) return;

    debug(
      "useGongoLive " + cursor.collection.name,
      JSON.stringify(cursor._query)
    );

    cursor.watch(
      (newData) => {
        debug("useGongoLive change", newData);
        // @ts-expect-error: XXX TODO later
        setData(newData);
      },
      { debounce: _opts.debounce }
    );

    return function cleanUp() {
      setData(null);
      cursor.unwatch();
    };
  }, [slug]);

  return /* previouslySetData || */ cursor;
};

//function useGongoLive(cursorFunc, opts) {
const useGongoLive = <DocType extends Document>(
  cursorFunc: CursorFunc<DocType>,
  opts?: useGongoCursorOpts
) => {
  const cursor = useGongoCursor(cursorFunc, opts);
  return cursor ? cursor.toArraySync() : [];
};

// function useGongoOne(origCursorFunc, opts) {
const useGongoOne = <DocType extends Document>(
  origCursorFunc: CursorFunc<DocType>,
  opts?: useGongoCursorOpts
) => {
  // untested, should work, original below.  allow nullish.
  //const cursorFunc = db => origCursorFunc(db).limit(1);
  // const cursorFunc = (db: Database) =>
  //  origCursorFunc && origCursorFunc(db).limit(1);
  // 2022-10-31 dont think above ever worked but this seems to :)
  function cursorFunc(db: Database) {
    const cursor = origCursorFunc && origCursorFunc(db);
    return cursor && cursor.limit(1);
  }
  const data = useGongoLive(cursorFunc, opts);
  if (data.length > 0) return data[0];
  else return null;
};

function useGongoUserId(/* opts = {} */) {
  const db = /* opts.db || */ gongoDb;
  const cursorFunc = () => db.gongoStore.find({ _id: "auth" }).limit(1);
  const data = useGongoLive(cursorFunc /*, opts */);
  return data[0] && data[0].userId;
}

export { useGongoCursor, useGongoLive, useGongoOne, useGongoUserId };
