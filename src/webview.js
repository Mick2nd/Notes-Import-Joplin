
	if (webviewApi)
	{
		window.onload="Load()";
		
		window.addEventListener(
			'message', 
			ev => { let msg = check(ev); if (msg !== null) console.info(`Message: ${JSON.stringify(msg)}`); });
		
		webviewApi.postMessage({ name: 'My Message', content: 'Content' });
		console.info('Hey Hey - a webviewApi');
	}

	document.addEventListener('click', (ev) =>
	{
		var element = ev.target;
		const tag = element.tagName ? element.tagName : '';
		console.info(`In click handler: ${element} : ${tag}`);
		if (tag == 'BUTTON')
		{
			webviewApi.postMessage({ name: 'My Message 2', content: 'Content 2' });
			console.info(`In ${element.innerText}`);
		}
		
		while(element && element.tagName && element.tagName.toUpperCase() != "IFRAME")
		{
			element = element.parentNode;
		}
		console.info(`${element}`);
	});
	
	/**
		Checks a message event 
	 */
	function check(ev)
	{
		if (ev.data.message &&
			ev.data.message.from &&
			ev.data.message.from === 'userWebview' &&
			ev.data.message.to &&
			ev.data.message.to === 'plugin')
		{
			// console.info('Valid message detected');
			return ev.data.message.content;
		}
		
		console.info(`No valid message detected: ${JSON.stringify(ev.data)}`);
		return null;
	}
	
	function Load(ev)
	{
		const target = ev ? ev.target : 'undefined';
		console.info(`In Load: ${target}`);
	}

	function Start(ev)
	{
		const target = ev ? ev.target : 'undefined';
		console.info(`In Start: ${target}`);
	}

	function Cancel(ev)
	{
		const target = ev ? ev.target : 'undefined';
		console.info(`In Cancel: ${target}`);
	}

/*
	Results of my tests:
	- webviewApi does exist
	- a webview instance could not be acquired 
	- functions Start / Cancel bound in HTML do their work, but event parameter is undefined
	- Load is never called, no idea how to bind to Load event
	- second method to bind event handler (addEventListener) is called, but code did not recognize
	  the button -> solved, tagName (UPPERCASE)
	- found the iframe in developer console, but not programatically

*/