
	/*
		let results
		try {
			results = await websql.tables()
			results = await websql.tableExists('item2')
			results = await websql.tableFields('item2')
		} catch (err) {
			console.log(21, err)
		}
		console.log(36, results)
	*/
	/*
			results = await websql.tableDrop('item')
			console.log('results', results)
	*/
	/*
			results = await websql.insert('item', {
				idSource: 1,
				idFeed: 2,
				title: 'title',
				abstract: 'werd werd werd',
				url: 'https://www.winamp.com',
				published: 123123,
				entered: 123122
			})
			console.log('results', results)
	*/
	/*
			results = await websql.update('item', 1, {
				entered: Math.floor(new Date().getTime() / 1000)
			})
			console.log('results', results)
	*/
	/*
			results = await websql.insertUpdate('item', {
				id: 1,
				idSource: 1,
				idFeed: 2,
				title: 'title',
				abstract: 'werd werd werd',
				url: 'https://www.winamp.com',
				published: 123123,
				entered: 123122
			},{
				entered: Math.floor(new Date().getTime() / 1000)
			})
			console.log('results', results)
	*/
	/*
			results = await websql.fetch('item', 2)
			console.log('results', results)
	*/
