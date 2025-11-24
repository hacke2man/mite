let login = _ => {
	return { tag: 'input', type: 'text', placeholder: 'login',
		onkeydown: (el, e) => e.key == "Enter" && fetch("/login", {
			method: "POST",
			headers: { "Content-Type": "text/plain" },
			body: JSON.stringify({
				username: location.host.split(/([^.]*)/)[1],
				password: el.value
			}),
		}).then(res => res.text())
		.then(text => {
			if (text.length > 0) {
				session.v = {
					loggedIn: true,
					id: text,
				};
				route(location.pathname);
				localStorage.setItem('session_id', text);
			}
		}),
		style: {
			color: 'var(--pri)',
			background: 'var(--tex)',
		}
	}
}
