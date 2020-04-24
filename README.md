# gongo-react

*React hooks for gongo-client*

Copyright(c) 2020 by Gadi Cohen <dragon@wastelands.net>.  MIT licensed.

## Quickstart

```js
import React from 'react';
import db from 'gongo-client';
import { useGongoLive } from 'gongo-react';

function App() {
  // That's it.  The component will update on any relevant change.
  const data = useGongoLive( () => db.collection('test').find() );

  return (
    <ol>
      { data.map(row => <li><code>{JSON.strinigfy(row)}</code></li> }      
    </ol>
  );
}

```

## Hooks

### useGongoLive( funcThatReturnsACursor )

LiveQuery on a result set, returns an array.

Example:

```js
const data = useGongoLive( () => db.collection('test').find() );
```

### useGongoOne( funcThatReturnsACursor )

LiveQuery for a single result.

Example:

```js
const user = useGongoOne( () => db.collection('users').find({ _id: userId }) );
```

### useGongoUserId(db)

LiveQuery on current userId... non-null if user is logged in.

```js
const userId = useGongoUserId(db);
```
