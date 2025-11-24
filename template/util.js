routes = {
	"/": home,
};

route = path => {
	let content = document.getElementById('content');
	dispose(content);
	content.innerHTML = '';
	htmc(((!session.v.loggedIn && login) || routes[path] || (_=>'404'))(), content);
}

customElements.define(
	"a-btn",
	class extends HTMLElement {
		constructor() {
			super();
			this.addEventListener('click', _=> {
				let path = this.getAttribute('to');
				history.pushState({}, "", path);
				dispose(app);
				route(path);
			})
		}
	}
);

let upTask = (info, v) => {
	if (info.v != v) {
		info.v = v;
		action("/update_task", info.v)
	}
};

let upProp = (info, k, v) => {
	if (info.v[k] != v) {
		info.v[k] = v;
		info.up();
		action("/update_task", info.v)
	}
};

let bSec = 1000;
let bMin = bSec*60;
let bHour = bMin*60;
let bDay = bHour*24;
let bWeek = bDay*7;
let bMonth = bWeek*4;
let bYear = bMonth*12;
let parseBreak = breakStr => {
	breakStr = breakStr.replaceAll(/[^a-zA-Z0-9.]/g,'');
	let breakMil = 0;
	let len = breakStr.length;
	while (breakStr.length > 0) {
		let [_, num, suffix, rest] = breakStr.split(/^([0-9.]+)([a-zA-Z])/)
		breakStr = rest;
		if (breakStr!=undefined&&Object.hasOwn(breakStr, 'length')) {
			if (breakStr.length == len) break;
			else len = breakStr.len;
		} else {
			break;
		}
		if (suffix == 'm') {
			breakMil += bMin * num;
			continue;
		}
		suffix = suffix.toUpperCase();
		switch (suffix) {
			case 'Y': breakMil += bYear * num; break;
			case 'M': breakMil += bMonth * num; break;
			case 'W': breakMil += bWeek * num; break;
			case 'D': breakMil += bDay * num; break;
			case 'H': breakMil += bHour * num; break;
			case 'S': breakMil += bMin * num; break;
		}
	}
	return breakMil;
}
function duration(dur) {
	if (Math.abs(dur) > bYear) return (dur/bYear).toFixed(1) + " years";
	if (Math.abs(dur) > bMonth) return (dur/bMonth).toFixed(1) + " months";
	if (Math.abs(dur) > bWeek) return (dur/bWeek).toFixed(1) + " weeks";
	if (Math.abs(dur) > bDay) return (dur/bDay).toFixed(1) + " days";
	if (Math.abs(dur) > bHour) return (dur/bHour).toFixed(1) + " hrs";
	if (Math.abs(dur) > bMin) return Math.floor(dur/bMin) + " mins";
	return Math.floor(dur/bSec) + " secs";
}
function timeSince(date, taskBreak) {
	var dur = parseBreak(taskBreak) - (new Date() - date).toFixed(1);
	return duration(dur);
}
function timeTill(date) {
	var dur = (date - new Date()).toFixed(1);
	return duration(dur);
}
Number.prototype.clamp = function(min, max) {
  return Math.min(Math.max(this, min), max);
};

let setRootStyle = style => {
	for (let [k, v] of Object.entries(style)) {
		document.documentElement.style.setProperty(k, v);
	}
}

symbols = {
	edit: '<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/>',
}

customElements.define(
	"sym-bol",
	class extends HTMLElement {
		constructor() { super() }
		connectedCallback() {
			this.innerHTML =
				'<svg xmlns="http://www.w3.org/2000/svg" style="vertical-align: middle;" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width=".12rem" stroke-linecap="round" stroke-linejoin="round">'
				+symbols[this.getAttribute('name')]
				+'</svg>';
		}
	}
);

let action = (endpoint, arg1, arg2) => {
	let body = '0';
	let callback = 0;
	if (typeof arg1 == "function") {
		callback = arg1;
	} else {
		body = arg1;
		callback = arg2 || (_=>0);
	}
	fetch(endpoint, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			session_id: session.v.id,
			action_body: JSON.stringify(body),
		})
	})
		.then(res => res.json())
		.then(obj => callback(obj));
}

let taskRatio = info => {
	let mil = (new Date() - new Date(info.last_done)).valueOf();
	let breakMil = Math.max(parseBreak(info.break), 1000*60);
	return (breakMil - mil) / breakMil;
}

let dueScore = info => {
	if (info.done) return 1;
	let mil = (new Date(info.due) - new Date()).valueOf();
	if (mil > bWeek) {
		return 1;
	} else {
		return mil / bWeek;
	}
}

let taskOrder = info => {
	return info.type==0? taskRatio(info):dueScore(info);
}
