
	const fieldTypes = ['BLOB', 'BOOL', 'CLOB', 'FLOAT', 'INTEGER', 'NUMERIC', 'REAL', 'VARCHAR', 'NVCHAR', 'TEXT'];
	const settings = {db: 'main', description: 'Site DB', version: '1.0', size: (2 * 1024 * 1024)};

  class WebSQL{

    constructor (options = {}) {
			for (let [name, def] of settings)
				this[name] = options[name] || def
    }

    async connect (options = {}) {
      return new Promise((resolve, reject) => {
				for (let [name, def] of settings)
					if (options[name])
						this[name] = options[name];
				try{
	      	this.client = window.openDatabase(this.escapeField(this.db), this.version, this.description, this.size);
				}catch(err){
					reject(err);
				}
			});
    }

    async transaction () {
      return new Promise((resolve, reject) => {
      	this.client.transaction((tx) => {
          resolve(tx)
        });
      });
    }

    async query (query, values) {
      return new Promise((resolve, reject) => {
        const tx = await this.transaction();
        tx.executeSql(query, values, (tx, results) => {
          resolve(results);
        },function(tx, err){
          reject(err);
        });
      });
    }

    tables (table) {
      let query = 'SELECT tbl_name, sql from sqlite_master WHERE type = ?'
      let values = ['table']

    }

    tableExists (table) {
      let query = 'SELECT * FROM sqlite_master WHERE `type` = ? AND `name` = ?'
      let values = ['table', table]
    }

    tableCreate (table, fields) {
    }

    tableFields (table) {
    }

    tableDrop (table) {
  	   let query = 'DROP TABLE ' + this.escapeField(table)
    }

    fetch (table, id) {
    }

    insert (table, insert, ignore) {
    }

    update (table, id, update) {
    }

    insertUpdate (table, insert, update) {
    }

    field (options) {
    }

    escapeField (value) {
			value = String(value);
			return value.replace(/[^a-zA-Z0-9_\.]/g, '');
    }

  }

/*
	function websql(){
    this.client = null
    this.options = (typeof options == 'object') ? options : {}
    this.defaultOptions = {
    	db : 'main',
    	version : '1.0',
    	description : 'Local DB',
    	size : (2 * 1024 * 1024)
    }
    this.queue = []
    this.connected = false
	}

  websql.prototype.connect = function(options){
  	this.options = _.extend(this.defaultOptions,this.options);
    if(typeof options=='object')this.options=_.extend(this.options,options);
  	//console.log(this.options);
    try{
      this.client = openDatabase(this.escapeField(this.options.db),this.options.version,this.options.description,this.options.size);
      //console.log(this.client);
      this.connected=true;
    }catch(e){
    	console.log('- Database Connection Error',e);
      this.connected=false;
		}
		if(!this.client||!this.connected){
      this.connected=false;
      console.log('- DB Connect error');
		}else{
      //console.log('= DB Connected');
      var cb=this.queue.shift();
      while(cb){
      	this.client.transaction(function(tx){
          cb(tx);
        });
        cb=this.queue.shift();
      }
		}
		return this;
  }

  websql.prototype.setClient = function(client){
  	this.client=client;
    this.connected=true;
    return this;
  },

	websql.prototype.escapeField = function(value){
		value=String(value);
		return value.replace(/[^a-zA-Z0-9_\.]/g,'');
	},

  websql.prototype.require = function(cb){
    if(this.connected){
    	this.client.transaction(function(tx){
        cb(tx);
      });
    }else{
      this.queue.push(cb);
    }
  },

  websql.prototype.tableExists = function(table,cb){
    if(typeof table!='string'){
    	console.log('- tableExists:table needs to be a string');
    	return null;
    }
    var query='SELECT * FROM sqlite_master WHERE `type` = ? AND `name` = ?';
    var values=['table',table];
  	//console.log('= query',query,values);
    this.require(function(tx){
      tx.executeSql(query,values,function(tx,results){
      	cb((results.rows.length==1)?true:false);
      },function(tx,e){
      	console.log(e.message);
        cb(false);
      });
    });
  },

  websql.prototype.createTable = function(table,fields,cb){
  	var self=this;
  	if(typeof table!='string'||typeof fields!='object'||!fields.length){
  		if(cb)cb(false);
  		return false;
  	}
  	var query='';
  	var values=[];
  	_.each(fields,function(field){
  		query+=', `'+self.escapeField(field.name)+'`'
				+(field.type?' '+field.type:'')
				+(field.type&&field.length?'('+field.length+')':'')
				+(field['null']?' NULL':' NOT NULL');
			if(field['default'])
				query+=' DEFAULT '+(typeof field['default']=='string'?'"'+field['default'].replace('"','\\"')+'"':field['default']);
			if(field['index'])
				query+=' '+field['index']+(field['index']=='PRIMARY KEY'&&field.ai?' AUTOINCREMENT':'');
  	});
  	var query='CREATE TABLE IF NOT EXISTS `'+self.escapeField(table)+'` ('+query.substr(2)+' )';
  	//console.log('= query',query);
    this.require(function(tx){
      tx.executeSql(query,[],function(tx,results){
      	if(cb)cb(true);
      },function(tx,e){
      	console.log(e.message);
        if(cb)cb(false);
      });
    });
  }

  websql.prototype.tableFields = function(table,cb){
  	var self=this;
    if(typeof table!='string'){
    	console.log('- tableExists:table needs to be a string');
    	return null;
    }
    var query='SELECT * FROM sqlite_master WHERE `type` = ? AND `name` = ?';
    var values=['table',table];
  	//console.log('= query',query,values);
    this.require(function(tx){
      tx.executeSql(query,values,function(tx,results){
        if(results.rows.length!=1){
          cb(false);
        }else if(results.length!=1){
        	var parse=results.rows.item(0).sql;
        	var index=parse.indexOf('(')+1;
        	parse=parse.substr(index,parse.lastIndexOf(')')-index).split(', ');
        	var fields=[];
        	for(var i in parse){
        		var field=parse[i].replace('NOT NULL','NOTNULL');
        		field=field.replace('PRIMARY KEY','PRIMARY');
        		field=field.replace('(',' LENGTH:');
        		field=field.replace(')','');
        		field=field.split(' ');
        		var current={};
        		for(var f in field){
        			if(field[f].substr(0,1)=='`')current.name=field[f].substr(1,field[f].length-2);
        			else if(field[f].indexOf('NULL')!==-1)current.null=field[f].replace('NOTNULL','NOT NULL');
        			else if(field[f].substr(0,7)=='LENGTH:')current.length=+field[f].substr(8);
        			else if(field[f]=='PRIMARY'||field[f]=='UNIQUE'||field[f]=='KEY')current.key=field[f].replace('PRIMARY','PRIMARY KEY');
        			else current.type=field[f];
        		}
        		fields.push(current);
        	}
          cb(fields);
        }
      },function(tx,e){
      	console.log(e.message);
        cb(false);
      });
    });
  }

  websql.prototype.dropTable = function(table,cb){
  	var self=this;
  	if(typeof table!='string')return false;
  	var query='DROP TABLE '+self.escapeField(table);
  	console.log('= query',query);
    this.require(function(tx){
      tx.executeSql(query,[],function(tx,results){
      	if(cb)cb(true);
      },function(tx,e){
      	console.log(e.message);
        if(cb)cb(false);
      });
    });
  }

  websql.prototype.record = function(table,id,cb){
    if(typeof table!='string'||typeof id!='number')return false;
    var query='SELECT * FROM '+this.escapeField(table)+' WHERE id = ?';
    var values=[id];
    this.require(function(tx){
    	//console.log('= query',query,values);
      tx.executeSql(query,values,function(tx,results){
        if(results.rows.length!=1){
          cb(false);
        }else if(results.length!=1){
          cb(results.rows.item(0));
        }
      },function(tx,e){
      	console.log(e.message);
        cb(false);
      });
    });
  }

  websql.prototype.insert = function(table,record,cb,ignore){
  	var self=this;
    if(typeof table!='string'||typeof record!='object')return false;
    var query='INSERT'+(ignore?' OR IGNORE':'')+' INTO `'+this.escapeField(table)+'` ( ';
    query+=_.map(record,function(value,name){return '`'+self.escapeField(name)+'`'}).join(', ')
    query += ' ) VALUES ( '
    var values=[];
    query+=_.map(record,function(value,name){values.push(value);return '?'}).join(', ')
    query += ' )'
    this.require(function(tx){
    	//console.log('= query',query,values);
      tx.executeSql(query,values,function(tx,results){
      	if(cb)cb((!results.rowsAffected)?false:true);
      },function(tx,e){
      	console.log(e.message);
        if(cb)cb(false);
      });
    });
  }

  websql.prototype.update = function(table,id,record,cb){
  	var self=this;
    if(typeof table!='string'||(typeof id!='number'&&typeof id!='string')||typeof record!='object')return false;
    var query='UPDATE '+this.escapeField(table)+' SET ';
   	var values=[];
    if(typeof record.id!='false')delete record.id;
    query+=_.map(record,function(value,name){values.push(value);return self.escapeField(name)+' = ?'}).join(', ')
    query +=' WHERE id = ?';
    values.push(id);
    this.require(function(tx){
    	//console.log('= query',query,values);
      tx.executeSql(query,values,function(tx,results){
      	if(cb)cb((!results.rowsAffected)?false:true);
      },function(tx,e){
      	console.log(e.message);
        if(cb)cb(false);
      });
    });
  }

  websql.prototype.field = function(options){
  	if(typeof options=='string')options={name:options};
  	if(typeof options.name!='string')return false;
  	if(typeof options['type']=='undefined')options.type='NVCHAR';
  	var field={
  		name:options.name,
  		type:(fieldTypes.indexOf(options['type'].toUpperCase())!==-1)?options.type.toUpperCase():false,
  		length:(typeof options['length']!='undefined'&&options['length'])?options['length']:false,
  		'null':(typeof options['null']!='undefined'&&options['null'])?true:false,
  		'index':(typeof options['index']=='string'&&['UNIQUE','PRIMARY KEY','KEY'].indexOf(options['index'].toUpperCase())!==-1)?options['index'].toUpperCase():false,
  		'ai':(options['type'].toUpperCase()=='INTEGER'&&typeof options['index']=='string'&&options['index'].toUpperCase()=='PRIMARY KEY'&&(typeof options.ai=='undefined'||options.ai))?true:false
  	};
  	if(typeof options['default']!='undefined'){
  		if(typeof options['default']=='number'||(typeof options['default']=='object'&&options['default']===null)||(typeof options['default']=='string'&&options['default']===''))
	  		field['default']=options['default'];
	  	else if(typeof options['default']=='boolean')
	  		field['default']=options['default']?1:0;
	  	else{
	  		console.log('Cannot use as default:',options['default']);
	  	}
	  }
	  return field;
  }

	export default websql;

*/













/*
		CIO.DBClient.createTable('item',[
			WebSQLField({name:'id',type:'integer',index:'PRIMARY KEY'}),
			WebSQLField({name:'idSource',type:'integer'}),
			WebSQLField({name:'idFeed',type:'integer'}),
			WebSQLField({name:'title',type:'varchar',length:255}),
			WebSQLField({name:'abstract',type:'varchar',length:255}),
			WebSQLField({name:'url',type:'varchar',length:255}),
			WebSQLField({name:'published',type:'integer'}),
			WebSQLField({name:'entered',type:'integer'})
		]);
*/
/*
		CIO.DBClient.insert('item',{
			idSource:1,
			idFeed:1,
			title:'test',
			abstract:'heehee',
			url:'http://google.ca',
			published:(now-300),
			entered:now
		},function(success){
			console.log(success?':)':':(')
		});
*/
/*
		CIO.DBClient.update('item',2,{
			title:'numba 2',
			abstract:'moo',
			url:'http://cow.ca',
			entered:now
		},function(success){
			console.log(success?':)':':(')
		});
*/
/*
		CIO.DBClient.record('item',2,function(record){
			console.console.log(record);
		});
*/
/*

	var query=new RDBSelect('market')
		.orderBy('group')
		.orderBy('title')

	var select=new window.RDBWebSQL(CIO.DBClient,query.build());
	select.execute(function(results){
	})

*/
