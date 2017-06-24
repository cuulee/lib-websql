
const fieldTypes = ['BLOB', 'BOOL', 'CLOB', 'FLOAT', 'INTEGER', 'NUMERIC', 'REAL', 'VARCHAR', 'NVCHAR', 'TEXT']
const settings = {db: 'main', description: 'Site DB', version: '1.0', size: (2 * 1024 * 1024)}
const excludeTables = ['sqlite_master', '__WebKitDatabaseInfoTable__', 'sqlite_sequence']

class WebSQL{

	constructor (options = {}) {
		for (let name in settings)
			this[name] = options[name] || settings[name]
		return this
	}

	async connect (options = {}) {
		for (let name in settings)
			if (options[name])
				this[name] = options[name]
		this.client = window.openDatabase(this.escapeField(this.db), this.version, this.description, this.size)
		return this
	}

	async transaction () {
		return new Promise(async (resolve, reject) => {
			try {
		  	this.client.transaction((tx) => {
					resolve(tx)
		    })
			} catch (err) {
				reject(err)
			}
		})
	}

	async query (query, values, select) {
		return new Promise(async (resolve, reject) => {
			try {
		    let tx = await this.transaction()
		    tx.executeSql(query, values, (tx, results) => {
					if (!select) {
		      	resolve(results)
					}else{
						let rows = []
						for(var i = 0; i < results.rows.length; i++)
							rows.push(results.rows.item(i))
		      	resolve(rows)
					}
		    }, function(tx, err) {
					throw err
		    })
			} catch (err) {
				reject(err)
			}
		})
	}

	async tables (table) {
		const query = 'SELECT tbl_name, sql from sqlite_master WHERE type = ?'
		const values = ['table']
		var results = await this.query(query, values)
		let tables = []
		for (let i in results.rows)
			if(results.rows[i].tbl_name && excludeTables.indexOf(results.rows[i].tbl_name) === -1)
				tables.push(results.rows[i].tbl_name)
		return tables
	}

	async tableExists (table) {
		const query = 'SELECT * FROM sqlite_master WHERE `type` = ? AND `name` = ?'
		const values = ['table', table]
		var results = await this.query(query, values)
		return results.rows.length == 1 ? true : false
	}

	async tableCreate (table, fields, ifNotExists) {
		if(typeof table != 'string' || typeof fields != 'object' || !fields.length)
			throw 'Invalid Params'
		let query = ''
		let values = []
		for(let field of fields){
			query += ', `' + this.escapeField(field.name) + '` ' + field.type + (field.length ? '(' + field.length + ')' : '') + (field['null'] ? ' NULL' : ' NOT NULL')
			if(field['default']){
				query += ' DEFAULT ?'
				values.push(field.default)
			}
			if(field['index'])
				query += ' ' + field['index'] + (field['index'] == 'PRIMARY KEY' && field.ai ? ' AUTOINCREMENT' : '')
		}
		query = 'CREATE TABLE ' + (ifNotExists ? 'IF NOT EXISTS ' : '') + '`' + this.escapeField(table) + '` (' + query.substr(2) + ')'
		return await this.query(query, values)
	}

	async tableFields (table) {
		const query = 'SELECT * FROM sqlite_master WHERE `type` = ? AND `name` = ?'
		const values = ['table', table]
		var results = await this.query(query, values)
		if(results.rows.length != 1)
			throw 'Invalid'
		let parse = results.rows.item(0).sql
		const index = parse.indexOf('(') + 1
		parse = parse.substr(index, parse.lastIndexOf(')') - index).split(', ')
		let fields = []
		for(var i in parse){
			var field = parse[i].replace('NOT NULL', 'NOTNULL')
			field = field.replace('PRIMARY KEY', 'PRIMARY')
			field = field.replace('(',' LENGTH:')
			field = field.replace(')', '')
			field = field.split(' ')
			var current = {}
			for(var f in field){
				if(field[f].substr(0,1) == '`')
					current.name = field[f].substr(1, field[f].length - 2)
				else if(field[f].indexOf('NULL') !== -1)
					current.null = field[f].replace('NOTNULL', 'NOT NULL')
				else if(field[f].substr(0, 7) == 'LENGTH:')
					current.length = +field[f].substr(8)
				else if(field[f] == 'PRIMARY' || field[f] == 'UNIQUE' || field[f] == 'KEY')
					current.key = field[f].replace('PRIMARY', 'PRIMARY KEY')
				else
					current.type = field[f]
			}
			fields.push(current)
		}
		return fields
	}

	async tableDrop (table) {
		let query = 'DROP TABLE ' + this.escapeField(table)
		return await this.query(query)
	}

	async fetch (table, where) {
		let {query, values} = this.buildWhere(where)
		query = 'SELECT * FROM ' + this.escapeField(table) + ' WHERE ' + query
		var results = await this.query(query, values, true)
		if(!results || results.length != 1)
		  throw 'Invalid Results'
		return results[0]
	}

	async select (table, where) {
		let {query, values} = this.buildWhere(where)
		query = 'SELECT * FROM ' + this.escapeField(table) + ' WHERE ' + query
		return await this.query(query, values, true)
	}

	async insert (table, insert, ignore) {
		let fields = []
		let values = []
		for (let name of Object.keys(insert)) {
			fields.push(this.escapeField(name))
			values.push(insert[name])
		}
		var query = 'INSERT ' + (ignore ? 'OR IGNORE ' : '') + 'INTO `' + this.escapeField(table) + '` (`' + fields.join('`, `') + '`) VALUES (' + fields.map(x => '?').join(', ') + ')'
		var results = await this.query(query, values)
		if(!ignore && !results.rowsAffected)
			throw 'Nothing Saved'
		return results.insertId
	}

	async update (table, where, update) {
		let fields = []
		let valuesAll = []
		let {query, values} = this.buildWhere(where)
		for(let name of Object.keys(update)) {
			fields.push('`' + this.escapeField(name) + '` = ?')
			valuesAll.push(update[name])
		}
		query = 'UPDATE `' + this.escapeField(table) + '` SET ' + fields.join(', ') + ' WHERE ' + query
		valuesAll = [...valuesAll, ...values]
		var results = await this.query(query, valuesAll)
		if(!results.rowsAffected)
			throw 'Nothing Saved'
	}

	async delete (table, where) {
		let {query, values} = this.buildWhere(where)
		query = 'DELETE FROM `' + this.escapeField(table) + '` WHERE ' + query
		var results = await this.query(query, values)
		if(!results.rowsAffected)
			throw 'Nothing Saved'
	}

	field (options) {
		if(typeof options == 'string')
			options = {name: options}
		if(typeof options.name != 'string')
			return false
		if(typeof options['type'] == 'undefined')
			options.type = 'NVCHAR'
		var field = {
			name: options.name,
			type: fieldTypes.indexOf( options['type'].toUpperCase()) !== -1 ? options.type.toUpperCase() : false,
			length: typeof options['length'] != 'undefined' && options['length'] ? options['length'] : false,
			'null': typeof options['null'] != 'undefined' && options['null'] ? true : false,
			'index': typeof options['index'] == 'string' && ['UNIQUE', 'PRIMARY KEY', 'KEY'].indexOf(options['index'].toUpperCase()) !== -1 ? options['index'].toUpperCase() : false,
			'ai': options['type'].toUpperCase() == 'INTEGER' && typeof options['index'] == 'string' && options['index'].toUpperCase() == 'PRIMARY KEY' && (typeof options.ai == 'undefined' || options.ai) ? true : false
		}
		if(typeof options['default'] != 'undefined')
			field['default'] = options['default']
		return field
	}

	escapeField (value) {
		value = String(value)
		return value.replace(/[^a-zA-Z0-9_\.]/g, '')
	}

	buildWhere (where){
		if(typeof where != 'object')
			where = {id: where}
		let query = ''
		let values = [];
		for (let name of Object.keys(where)){
			query += ' AND ' + this.escapeField(name) + ' = ?'
			values.push(where[name])
		}
		return {query: query.substr(5), values}
	}

}

module.exports = WebSQL
