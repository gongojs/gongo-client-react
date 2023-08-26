import { useState, useEffect } from "react";
import db, { Collection, Database } from "gongo-client";
import type { Document } from "gongo-client/lib/browser/Collection";
import type {
  SubscriptionArguments,
  SubscriptionOptions,
} from "gongo-client/lib/browser/Subscription";

import { debug } from "./utils";

function useGongoSub(
  name: string | null | undefined | false,
  args?: SubscriptionArguments,
  opts?: SubscriptionOptions
) {
  // Note: db.subscribe will return a matching existing subscription.
  // const sub = name && db.subscribe(name, opts);
  const [sub, setSub] = useState(name && db.subscribe(name, args, opts));

  useEffect(() => {
    if (!name) return;
    debug("sub", name, args, opts);

    // NEW, untested, but should work `:)
    setSub(name && db.subscribe(name, args, opts));
    return () => {
      debug("unsub", sub);
      sub && sub.stop();
    };
  }, [name, JSON.stringify(args), JSON.stringify(opts)]);

  return {
    sub,
    subscription: sub,
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    loadMore: (sub && sub.loadMore.bind(sub)) || (() => {}),
    // loading: TODO,
    // ready: TODO,
    // error: TODO,
    isMore: sub && sub.lastSortedValue !== "__END__",
  };
}

// copied from previous version, unchecked, may not work.
/*
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
*/

function useGongoIsPopulated(
  collOrCollNameOrDatabase?: string | Database | Collection<Document>
) {
  if (!collOrCollNameOrDatabase) collOrCollNameOrDatabase = db;
  else if (typeof collOrCollNameOrDatabase === "string")
    collOrCollNameOrDatabase = db.collection(collOrCollNameOrDatabase);

  const [isPopulated, setIsPopulated] = useState(
    collOrCollNameOrDatabase.populated
  );

  useEffect(() => {
    if (isPopulated) return;

    if (collOrCollNameOrDatabase === db) {
      // the database, wait for idb collectionsPopulated event
      const update = () => {
        debug("populated", db.name, db.populated);
        db.idb.off("collectionsPopulated");
        try {
          setIsPopulated(true);
        } catch (e) {
          console.error(e);
        }
      };
      db.idb.on("collectionsPopulated", update);
      return () => db.idb.off("collectionsPopulated", update);
    } else {
      // a collection, watch it.
      const collection = collOrCollNameOrDatabase as Collection<Document>;
      const cs = collection.watch();
      cs.on("populateEnd", () => {
        debug("populated", collection.name, collection.populated);
        cs.close();
        setIsPopulated(true);
      });
      return () => cs.close();
    }
  }, []);

  return isPopulated;
}

/*
function IsPopulated(props) {
  // TODO, could pass initTime to children for UI hints on slow loading
  const match = props.match !== false;
  const isPopulated = useGongoIsPopulated(props.collection);
  return isPopulated === match ? props.children : null;
}
*/

function IsPopulated(...args: unknown[]) {
  alert("IsPopulated() called with " + JSON.stringify(args));
}

export { useGongoSub, useGongoIsPopulated, IsPopulated };
