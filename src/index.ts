import joplin from 'api';
import {  MenuItemLocation, ImportContext, FileSystemItem } from 'api/types';

// const nodezip = require('node-zip');
const JSON5 = require('json5')

async function setupPluginCommand()
{
	const scriptId = 'pluginCommandImportQnap';

	await joplin.commands.register(
		{
			name: scriptId,
			label: 'Import QNAP Notes',
			execute: async (args: any) => { alert('Testing plugin command 1'); return args; },
		});
	
	await joplin.views.menuItems.create(
		'mnuImportQnapNotes', 
		scriptId,
		MenuItemLocation.Tools); 
		
	await joplin.interop.registerImportModule(
		{
			format: 'jex',
			isNoteArchive: true,
			description: 'Imports Qnap Notes Station Notabooks',
			fileExtensions: [ 'ns3', ],
			sources: [ FileSystemItem.File, ],
			onExec: async (ctx: ImportContext) =>
			{
				/*
				var zip = new nodezip.JSZip(ctx.sourcePath);
				var file = zip.files('data.json');
				var json = JSON5.parse(file);
				console.info(json);
				*/
			}
		}); 
};

joplin.plugins.register({
	onStart: async function() 
	{
		try
		{
			console.info('Hello world. Test plugin started!');
			await setupPluginCommand();
			console.info('Menu command registered')		
		}
		catch
		{ 
			console.error('Exception occurred')		
		}
	}});

