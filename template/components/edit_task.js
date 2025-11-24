let taskEditor = (task, tasks) => {
	let localTask = sig(
		task?{...task.v}:{
			type: 0,
			break: '',
			done: false,
			due: new Date().valueOf(),
		}
	);
	return {
		inner:[
			{tag: 'select', id: 'taskType',
				run: el => el.children[localTask.v.type].selected=true,
				inner: [
					{tag: 'option', value: 0, inner: 'break'},
					{tag: 'option', value: 1, inner: 'due'}
				],
				onchange: el=> {
					localTask.v.type=parseInt(el.value);
					localTask.up();
				}
			},
			{tag: 'input', type:'text', class:'text-box',
				placeholder: 'task name', value: localTask.v.label || '',
				oninput: el => localTask.v.label = el.value
			},
			{
				inner: esub(_=>{
					if (localTask.v.type == 0) {
						return {
							tag: 'input', type:'text', class:'text-box',
							placeholder: 'break', value: localTask.v.break || '',
							oninput: el => localTask.v.break = el.value
						}
					} else {
						return {
							tag: 'input', type:'date', class:'text-box',
							placeholder: 'break', value: localTask.v.break || '',
							oninput: el => localTask.v.due = new Date(el.value+'T00:00:00').valueOf(),
							value: _=>{
								let pad = number => String(number).padStart(2, '0');
								let due = new Date(localTask.v.due);
								return `${due.getFullYear()
								}-${pad(due.getMonth() + 1)
								}-${pad(due.getDate())}`;
							},
							style: {
								color: 'var(--pri)',
								background: 'var(--tex)',
								padding: '.2rem .4rem',
								marginBottom: '.3rem',
								display: 'block',
							}
						}
					}
				}, [localTask]),
			},
			{inner: esub(_=> {
				if (localTask.v.type == 0) {
					return { tag: 'input', type: 'date',
						value: _=>{
							let pad = number => String(number).padStart(2, '0');
							let due = new Date(localTask.v.last_done);
							return `${due.getFullYear()
							}-${pad(due.getMonth() + 1)
							}-${pad(due.getDate())}`;
						},
						oninput: el => localTask.v.last_done = new Date(el.value+'T00:00:00').valueOf(),
					};
				} else {
					return {inner:[
						{ tag: "label", inner: "done " },
						{ tag: 'input', type: "checkbox", checked: localTask.v.done,
							onchange: el => localTask.v.done = el.checked,
						}
					]};
				}
			}, [localTask])},
			{
				inner: [
					{ tag: 'button', inner: 'cancel',
						onclick: _=> overlay.v = undefined,
					},
					{ tag: 'button', inner: 'save',
						onclick: _=> {
							if (task != undefined) upTask(task, localTask.v);
							else {
								localTask.v.last_done = new Date().valueOf(),
								tasks.v.push(newTask(localTask.v));
								tasks.up();
								action(
									"/add_task",
									localTask.v,
									id => localTask.v.id = parseInt(id)
								);
							}
							overlay.v = undefined;
						},
					},
					task? { tag: 'button', inner: 'delete',
						onclick: _=> {
							action('/delete_task', task.v, _=> task.remove())
							overlay.v = undefined;
						},
					}:'',
				],
				style: {
					display: 'flex',
					gap: '.45rem',
				}
			}
		],
		style: {
			width: 'min-content',
		}
	}
}
