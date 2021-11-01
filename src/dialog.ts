import joplin from 'api';
import { DialogResult, ButtonSpec } from 'api/types';

const fs = require('fs-extra');
const os = require('os');
const path = require('path');


var handle: any = null;

/**
	@abstract Encapsulates dialog functionality
 */	
export class Dialog
{
	id = 'Qnap Notes Importer Dialog';
	lines: string[];
	archive: string;
	
	/**
		@abstract Constructor
	 */
	public constructor(archive: string)
	{
		this.archive = archive;
		this.lines = [];
		for (var i = 1; i <= 50; i++)
		{
			this.lines.push(`<div>Line ${i}</div>`);
		} 
	}
	
	/**
		@abstract Creates the dialog
	 */
	public create = async function() : Promise<any>
	{
		if (handle == null)
			handle = await joplin.views.dialogs.create(this.id);
		const cancel = { id: 'close', title: 'Close' };
		await joplin.views.dialogs.setButtons(handle, [cancel]);
		await joplin.views.dialogs.setFitToContent(handle, false);
		await joplin.views.dialogs.setHtml(handle, this.get_html());
		await joplin.views.dialogs.addScript(handle, await this.write_css());
		await joplin.views.dialogs.addScript(handle, await this.write_script());
	}
	
	public add = async function(line: string) : Promise<void>
	{
		this.lines.push(line);
	}
	
	public open = async function() : Promise<DialogResult>
	{
		return await joplin.views.dialogs.open(handle);
	}
	
	
	/**
		@abstract Returns the Html for the Webview
	 */
	get_html = function() : string
	{
		var html = 
			`
			<div id="introduction">
				<h3>QNAP Notes importer</h3>
				<hr/>
				This importer will import the selected QNAP archive <br/> 
				<em>${this.archive}</em> <br/> into Joplin. Click <em>Start</em>
				to start the import. Click <em>Close</em> to cancel the process.
			</div>
			<div id="progress">
				<div>
					${this.lines.join('\n')} 
				</div>
			</div>
			<div id="button-container" >
				<button class="button" title='Cancel' onclick="Cancel()" >
					Cancel the import
				</button>
				<button class="button" title='Start' onclick="Start()" >
					Start the import
				</button>
			</div>`;
			
		return html;
	}
	
	/**
		@abstract This function writes a user css file and returns its filename
	 */
	write_css = async function() : Promise<string>
	{
		const tmp_file = './webview.css';
		return tmp_file;
	}
	
	/**
		@abstract This function writes a user script file and returns its filename
	 */
	write_script = async function() : Promise<string>
	{
		const tmp_file = './webview.js';
		return tmp_file;
	}
}
