import joplin from 'api';
import { Path } from 'api/types';

const { StringDecoder } = require('string_decoder');
const fs = require('fs-extra');
const os = require('os');
const path = require('path');


/**
	@abstract This class is responsible for interaction with the Joplin Data API
*/
export class Joplin
{
	/**
		@abstract Constructor
	*/
	public constructor(parent: any)
	{
		this.parent = parent;
		
		this.decoder = new StringDecoder('utf-8');
		this.encoder = new TextEncoder();
	}
	
	
	/**
		@abstract Sets the time values for the next post action
	 */
	public set_time = function(created: string, updated: string) : void
	{
		this.created = (new Date(created + '+00')).valueOf();
		this.updated = (new Date(updated + '+00')).valueOf();
	}


	/**
		@abstract Puts a folder (notebook) entry into Joplin with a POST request
	 */
	public put_folder = async function(parent_id: string, title: string) : Promise<any>
	{
        var data = { 'title': title, 'parent_id': parent_id };
		return await this.post(['folders'], { }, data);
	}


	/**
		@abstract Puts a Mark-down note into Joplin with a POST request
	 */
	public put_note = async function(parent_id: string, title: string, content: string) : Promise<any>
	{
        var data = { 'title': title, 'body': content, 'parent_id': parent_id };
		return await this.post(['notes'], { }, data);
	}


	/**
		@abstract Puts a resource into Joplin
	 */
	public put_resource = async function(meta_data: any, content: Uint8Array) : Promise<any>
	{
        var title = meta_data['title'];
        var resp = await this.get_resource(title);
		for (var item of resp)
		{
			if (item['size'] == content.length)
			{
				return item;
			}
		}
		
		return await this.post_resource(meta_data, content);
	}


	/**
		@abstract Creates a tag and assigns it to the given id's note
	 */
	public put_tag = async function(note_id: string, name: string) : Promise<any>
	{
		var tag = await this.get_tag(name);
		if (tag.length > 0)
		{
			tag = tag[0]; 
		} 
		else
		{
			var data = { title: name };
			tag = await this.post(['tags'], { }, data);
		}
		const id = tag.id || null;													// TODO: does method exist?
		if (id != null)
		{
			var data2 = { id: note_id };
			return await this.post(['tags', id, 'notes'], { }, data2);
		}
		
		return null;																// TODO: issue warning
	}


	/**
		@abstract Gets the tag with name with a GET request
	 */
	get_tag = async function(name: string) : Promise<any>
	{
        name = name.toLowerCase();
        return await this.search(name, 'tag');
	}


	/**
		@abstract POST request for resources
	*/
	post_resource = async function(meta_data: any, content: Uint8Array) : Promise<any>
	{
		try
		{
			const tmp_file = await this.get_tmp_file();
			await fs.writeFile(tmp_file, content);
		
	        var title = meta_data['title'];
			var data = [{ path: tmp_file }]
			var resp = await this.post(['resources'], { }, meta_data, data);
			
			await fs.remove(tmp_file);
		
			return resp;
		}
		catch (e)
		{
			console.error('Exception in Joplin.post_resource: ' + e);
			return { id: 'phantasy.pdf', title: title };
		}
	}
	
	/**
		@abstract Returns a temp file to be used as resource file
	 */
	get_tmp_file = async function() : Promise<string>
	{
        const tempPath = path.join(os.tmpdir(), 'tmpresource');
		await fs.mkdtemp(tempPath);
		return tempPath;
	}


	/**
		@abstract Gets the resource record(s) (json) with the given title
	*/
	get_resource = async function(title: string) : Promise<any>
	{
		var lst = [];
		var query = { fields: 'id,size'};
		for (var item of await this.search(title, 'resource'))
		{
			var response = await this.get(['resources', item.id], query);
			lst.push(response);
		}
		return lst;
	}

	
	/**
		@abstract Sends a search to the Data API
	*/
	search = async function(identifier: string, kind: string) : Promise<any>
	{
		var query = { query: identifier, type: kind };
		var response = await this.get(['search'], query);
		return response['items'];
	}
	
	
	/**
		@abstract Method to acquire an access token to the Joplin Data Api
	*/
	acquire_token = async function() : Promise<boolean>
	{
		const query = await joplin.data.post(['auth']);
		var response = {};
		do
		{
			response = await joplin.data.get(['auth', 'check'], query);
		}
		while(response['status'] == 'waiting');
		if (response['status'] == 'accepted')
		{
			this.token = response['token'];
			return true;
		}
		else
		{
			return false;
		}
	}
	
	
	/**
		@abstract The get method. Probably we will use the Joplin Api method directly.
	*/
	get = async function(path: Path, query?: any) : Promise<any>
	{
		var response = await joplin.data.get(path, query);
		return response;
	}
	
	/**
		@abstract The post method. Probably we will use the Joplin Api method directly.
	*/
	post = async function(path: Path, query?: any, body?: any, files?: any[]) : Promise<any>
	{
		if (path.length == 1 && body)
		{
			body['user_created_time'] = this.created;
			body['user_updated_time'] = this.updated;
		}
		
		var response = await joplin.data.post(path, query, body, files);

		return response;
	}
	
	parent: any;
	decoder: any;
	encoder: TextEncoder;
	created: number = new Date().valueOf();
	updated: number = new Date().valueOf();
}
