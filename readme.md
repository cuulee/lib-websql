# lib-websql

This is a Web SQL library for use in the browser. Very useful in electron and NW.js Apps. I know Web SQL is deprecated, but browsers have not yet announces it's removal so I am hoping it will stick around a long time or until they replace it with a relational database.

This library is written with ES7 `async await` so using a browser that supports it is key.

**Note:** You must used this library inside an `async` function.

## Usage

###Initialize

```javascript
async function init() {
	const WebSQl = require('./websql')
	const websql = new WebSQl(options)
	await websql.connect([options])
}
```
####Options (all optional)

* **db** database name
* **description** database description
* **version** database version
* **size** (2 * 1024 * 1024)

--

###Create a Table

```javascript
let fields = [
	websql.field({name: 'id', type: 'integer', index: 'PRIMARY KEY'}),
	websql.field({name: 'idArtist', type: 'integer'}),
	websql.field({name: 'title', type: 'integer'}),
	websql.field({name: 'description', type: 'varchar', length: 255, default: ''}),
	websql.field({name: 'entered', type: 'integer'}),
	websql.field({name: 'updated', type: 'integer'})
]
let results
try {
	results = await websql.tableCreate('album', fields, true)
} catch (err) {
	console.log('Table Error', err)
}
```
**Note** The 3rd parameter is a boolean if you want to use `IF NOT EXISTS`.

###MISC

**List Tables**

```javascript
try {
	let tables = await websql.tables()
} catch (err) {
	console.log('Something WENT WRONG', err)
}
```

**Check if Table Exists**

```javascript
try {
	let bool = await websql.tableExists('album')
} catch (err) {
	console.log('Something WENT WRONG', err)
}
```

**List Table Fields**

```javascript
try {
	let fields = await websql.tableFields('album')
} catch (err) {
	console.log('Something WENT WRONG', err)
}
```

**Drop a Table**

```javascript
try {
	await tableDrop('album')
} catch (err) {
	console.log('Something WENT WRONG', err)
}
```

####Field Object

When creating tables or listing fields the field object is always used. It consists of the following properties:

* **name** Field/Column Name
* **type** Column Type (See Below)
* **length** Size of Type
* **null** If Column Can Be Null
* **index** If the field is indexed `UNIQUE, PRIMARY KEY, KEY`
* **ai** If the integer is `Auto Increment`

(SQLite3) Column Types:

`BLOB`, `BOOL`, `CLOB`, `FLOAT`, `INTEGER`, `NUMERIC`, `REAL`, `VARCHAR`, `NVCHAR`, `TEXT`

###Inserting

```javascript
try {
	const now = Math.floor(new Date().getTime() / 1000)
	const idAlbum = await websql.insert('album', {
		idArtist: 1,
		title: 'Cows and Chickens',
		description: 'This is really great!',
		entered: now,
		updated: now
	})
} catch (err) {
	console.log('Something WENT WRONG', err)
}
```

###Updating

```javascript
try {
	await websql.update('album', 1, {
		updated: Math.floor(new Date().getTime() / 1000)
	})
} catch (err) {
	console.log('Something WENT WRONG', err)
}
```

###Fetching a Record

```javascript
try {
	const record = await websql.fetch('album', 2)
} catch (err) {
	console.log('Something WENT WRONG', err)
}
```

###Running a Query

```javascript
let query = 'SELECT * FROM ' + websql.escapeField(table) + ' WHERE id > ?'
let values = [20]
try {
	var results = await websql.query(query, values)
} catch (err) {
	console.log('Something WENT WRONG', err)
	return
}
for(var i = 0; i < results.row.length; i++)
	console.log('row', i, results.rows.item(i))
```

###To Do

* Drop Record
* Simpler Select Method
* Table Structure Sync (rather than migrations)
