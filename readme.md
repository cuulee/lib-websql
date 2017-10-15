# lib-websql

This is a Web SQL library for use in the browser. Very useful in Electron and NW.js Apps, things that require complex queries. I know Web SQL is deprecated, but browsers have not yet announces it's removal so I am hoping it will stick around a long time or until they replace it with a relational database. It  also might be worth checking out some alternatives like `RxDB`, `PouchDB`, `LinvoDB`, `NeDB` or `sql.js`.

This library is written with ES7 `async await` so using a browser that supports it is key.

**Note:** When using await you must used this library inside an `async` function. It is recommended having a decent amount of knowledge on `SQLite3` which is what WebSQL is using in-browser.

## Usage

### Initialize

```javascript
async function init() {
	const WebSQl = require('./websql')
	const websql = new WebSQl(options)
	await websql.connect(options)
}
```
#### Options (all optional)

* **db** database name
* **description** database description
* **version** database version
* **size** (2 * 1024 * 1024)

### Create a Table

```javascript
let fields = [
	websql.field({name: 'id', type: 'integer', index: 'PRIMARY KEY'}),
	websql.field({name: 'idArtist', type: 'integer'}),
	websql.field({name: 'title', type: 'integer'}),
	websql.field({name: 'description', type: 'varchar', length: 255, default: ''}),
	websql.field({name: 'entered', type: 'integer'}),
	websql.field({name: 'updated', type: 'integer'})
]
let results = await websql.tableCreate('album', fields, true)
```

**Note** Read more about field types below.

**Note** The 3rd parameter is a boolean if you want to use `IF NOT EXISTS`.

### MISC

**List Tables**

```javascript
let tables = await websql.tables()
```

**Check if Table Exists**

```javascript
let bool = await websql.tableExists('album')
```

**List Table Fields**

```javascript
let fields = await websql.tableFields('album')
```

**Drop a Table**

```javascript
await tableDrop('album')
```

#### Field Object

When creating tables or listing fields the field object is always used. It consists of the following properties:

* **name** Field/Column Name
* **type** Column Type (See Below)
* **length** Size of Type
* **null** If Column Can Be Null
* **index** If the field is indexed `UNIQUE, PRIMARY KEY, KEY`
* **ai** If the integer is `Auto Increment`

(SQLite3) Column Types:

`BLOB`, `BOOL`, `CLOB`, `FLOAT`, `INTEGER`, `NUMERIC`, `REAL`, `VARCHAR`, `NVCHAR`, `TEXT`

### Inserting

```javascript
const now = Math.floor(new Date().getTime() / 1000)
const idAlbum = await websql.insert('album', {
	idArtist: 1,
	title: 'Cows and Chickens',
	description: 'This is really great!',
	entered: now,
	updated: now
}, false)
```
**Note** The 3rd parameter is a boolean if you want to use `IGNORE`.

### Updating

```javascript
await websql.update('album', 1, {
	updated: Math.floor(new Date().getTime() / 1000)
})
```

### Fetching a Record

```javascript
const record = await websql.fetch('album', {id: 2})
```

### Fetching Multiple Records

```javascript
const record = await websql.select('album', {idArtist: 1})
```

### Running a Query With Results

```javascript
let query = 'SELECT * FROM ' + websql.escapeField(table) + ' WHERE id > ?'
let values = [20]
var results = await websql.query(query, values, true)
for(var i = 0; i < results.row.length; i++)
	console.log('row', i, results.rows.item(i))
```

**Note** The 3rd parameter is a boolean if you want processed results, false will return a SQLite results object.

### Deleting Rows

```javascript
await websql.delete('album', {id: 1})
```

### To Do

* Where Operators
* Table Structure Sync
