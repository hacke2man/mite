let taskComp = info => {
	let disp = undefined;
	info.sub(_=>{
		if (disp === undefined) return;
		let score = info.v.type==0?taskRatio(info.v):dueScore(info.v);
		disp.style.background = `hsl(${score.clamp(0,1)*120}, 50%, 50%)`;
	});
	return {
		inner: [
			{ tag: 'button', run: e => disp = e,
				onclick: _=>info.v.type==0?
				upProp(info, 'last_done', new Date().valueOf()):
				upProp(info, 'done', !info.v.done),
				inner: esub(_=>{
					return {
						inner: [
							{ inner: info.v.label,
								style: {
									minWidth: '6rem',
									textAlign: 'center',
									flexGrow: '1',
								},
							},
							{
								inner: [
									{ inner: info.v.type==0?
										timeSince(new Date(info.v.last_done), info.v.break):
										timeTill(new Date(info.v.due)),
									},
									{ inner: info.v.type==0?
										info.v.break:
										info.v.done?'done':'todo'},
								],
								style: {
									fontSize: '.9rem',
									display: 'flex',
									flexGrow: '1',
									maxWidth: '10rem',
									justifyContent: 'space-between',
								}
							}
						],
						style: {
							display: 'flex',
							flexWrap: 'wrap',
							// justifyContent: 'center',
							gap: '.5rem',
							color: 'var(--tex)',
							fontSize: '1.2rem',
						},
					};
				}, [info]),
				style: {
					padding: '.5rem',
					fontSize: '1rem',
					fontWeight: 600,
					height: '100%',
					width: '100%',
				},
			},
			{ inner: { tag:'sym-bol', name:'edit',
				onclick: _=> overlay.v = taskEditor(info),
				style: {
					background: 'var(--sec)',
					padding: '.2rem .4rem',
					fontSize: '.8rem',
					height: '100%',
				},
			}, style: { display: 'flex', alignItems: 'center'}},
		],
		style: { display: 'flex' }
	}
}
