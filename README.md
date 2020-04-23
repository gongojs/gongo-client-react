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
