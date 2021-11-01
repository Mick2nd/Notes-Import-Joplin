import joplin from 'api';
import { MenuItemLocation, ImportContext, FileSystemItem } from 'api/types';
import { Importer } from './importer';
import { Dialog } from './dialog';


/**
	@abstract Function or lambda to execute menu command
 */
const import_command = async () => 
{ 
	try
	{
		const archive = "D:/Users/jsoft/Downloads/NotesStation_Export_20_9_2021.ns3";
		var dlg = new Dialog(archive);
		await dlg.create();
		let dlg_promise = dlg.open();
		wait(1000).then(() => test());
		const res = await dlg_promise;
		console.info(res.id);
	}
	catch(e)
	{
		console.error('Exception in command: ' + e);
	}
	finally
	{
		console.info('Finally'); 
	} 
}


const wait = async (ts: number) : Promise<void> =>
{
	let promise = new Promise<any>((resolve) => setTimeout(resolve, ts));
	return promise;
}


const test = () : void =>
{
	window.postMessage({ name: 'My Message from Plugin' }, 'UserWebview');	
} 


/**
	@abstract Function or lambda serving as click handler
 */
const on_click = async () : Promise<void> =>
{
	try
	{
		const archive = "D:/Users/jsoft/Downloads/NotesStation_Export_20_9_2021.ns3";
		var importer = new Importer(archive);
		await importer.probe();
		console.info('Import successfully completed');
	}
	catch(e)
	{
		console.error('Exception in command: ' + e);
	}
	finally
	{
		console.info('Finally'); 
	} 
}


/**
	@abstract Function or lambda to execute import command
	
	This is the real import module integrated in Import sub menu. It will be invoked by the Joplin
	framework, if a Qnap notes archive is chosen.
 */
const import_module = async (ctx: ImportContext) : Promise<void> =>
{
	console.info('Just before returning Promise: ' + ctx.sourcePath);

	return new Promise(
		async function(resolve, reject) 
		{ 
			try 
			{
				console.info('Executing Import: ' + ctx.sourcePath);

				var importer = new Importer(ctx.sourcePath);
				await importer.import_it();
				
				console.info('Import successfully completed');
				resolve(); 
			}
			catch (ex)
			{
				console.error('Exception: ' + ex);
				reject();
			}
			finally
			{
				console.info('Final statement');
			}
		});
}


/**
	@abstract Function to Setup the plugin
 */
async function setupPlugin()
{
	/*
	const scriptId = 'pluginCommandImportQnap';
	const onClickId = 'pluginCommandImportQnapOnClick';

	await joplin.commands.register(
		{
			name: scriptId,
			label: 'Import QNAP Notes',
			execute: import_command, 
		});

	await joplin.commands.register(
		{
			name: onClickId,
			execute: on_click, 
		});
	
	await joplin.views.menuItems.create(
		'mnuImportQnapNotes', 
		scriptId,
		MenuItemLocation.Tools); 
	*/
		
	await joplin.interop.registerImportModule(
		{
			format: 'nsex',
			isNoteArchive: true,
			description: 'Qnap Notes Station Archive',
			fileExtensions: [ 'ns3', ],
			sources: [ FileSystemItem.File ],
			onExec: import_module,
		}); 
};


/**
	@abstract Registers the setup function
 */
joplin.plugins.register({
	onStart: async function() 
	{
		try
		{
			await setupPlugin();
		}
		catch(e)
		{ 
			console.error('Exception occurred: ' + e)		
		}
	}});

