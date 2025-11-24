let home = _=> {
	let tasks = sig([]);
	newTask = task => {
		let nt = sig(task);
		nt.remove = _=> {
			tasks.v.splice(tasks.v.indexOf(nt), 1);
			tasks.up();
		}
		let setup = false;
		setup = true;
		return nt;
	}
	let resort = _=> {
		if (document.activeElement.tagName !== "INPUT") {
			let prevRatio = tasks.v.length > 0? taskRatio(tasks.v[0].v):0.0;
			for(let i = 1; i < tasks.v.length; i++) {
				let task = tasks.v[i];
				if (taskRatio(task.v) < prevRatio) {
					tasks.v.sort((taska,taskb) => taskOrder(taska.v) - taskOrder(taskb.v));
					tasks.up();
					break;
				}
				prevRatio = taskRatio(task.v);
			}
		}
	}
	let updateColors = _=> {
		if (tasks.v.length == 0) return;
		for (let task of tasks.v) task.up();
	}
	action('/items', serverItems => {
		if (serverItems === 0) {
			localStorage.removeItem('session_id');
			location.reload();
		}
		serverItems.forEach(task => tasks.v.push(newTask(task)));
		tasks.up();
		resort();
		updateColors();
	})
	setInterval(updateColors, 1000);
	setInterval(resort, 1000);
	let lists = cmp(_=>split.v?[
		{filter: task=>task.v.type==0?true:false},
		{filter: task=>task.v.type==1?true:false},
	]:[
		{filter: _=>true},
	], [split, tasks]);
	return { class: 'content', inner: [
		{ inner: esub(_=>{
			return {
				inner: lists.v.map(list=>({
					class: 'space-children',
					style: { flexGrow: '1' },
					inner: esub(_=>tasks.v.filter(list.filter)
						.map(task=>taskComp(task)), [list])
				})),
				style: {
					display: 'flex',
					gap: '.5rem',
				},
				run: updateColors
			}
		}, [lists])},
		{ tag: 'button',
			inner: 'add task',
			onclick: _=> overlay.v = taskEditor(undefined,tasks)
		},
	]}
}
