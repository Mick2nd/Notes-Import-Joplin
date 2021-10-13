const StreamZip = require('node-stream-zip')
const { StringDecoder } = require('string_decoder');


/**
	@abstract Use this class for repeated functionality of sub structures 
			  (notebook -> section -> note -> tag)
 */
class Sub
{
	/**
		@abstract Constructor. Creates a template for injected content.
		@param name - the name of the name string
		@param sub_items - the name of the sub items array
		@param child - name of sub item in parent
	 */
	constructor(parent: QNAP, name: string, sub_items: any, sub_template: any)
	{
		this.parent = parent;
		this._name = name;
		this._sub_items = sub_items;
		this._sub_template = sub_template;		
	}
	
	/**
		@abstract Injects content into the template
		@param content - injected content
	 */
	inject = async function(content: any) : Promise<void>
	{
		this._content = content;
	}

	/**
		@abstract Iterates through the sub items and returns them piece by piece (Generator)
	 */
	get_items = async function*(content: any = null) : any
	{
		if (content === null)
			content = this._content;
		
		for (let item of content[this._sub_items])
		{
			if (this._sub_template !== null)
			{
				await this._sub_template.inject(item);
				yield this._sub_template;
			}
		}
	}
	
	/**
		@abstract The iterator as Getter
	 */
	get items() : Promise<any>
	{
		return this.get_items();
	}
	
	/**
		@abstract Name of the item
	 */
	get name()
	{
		return this._content[this._name];
	}
	
	/**
		@abstract Time of the item
	 */
	get time()
	{
		return [ this._content.create_time, this._content.update_time ];
	}
	
	parent: QNAP;
	_content: any;
	_name: string;
	_sub_items: string;
	_sub_template: any;
}


/**
	@abstract This class extends Sub by note accessing functions
 */
class SubNote extends Sub
{
	/**
		@abstract Constructor. Nothing special
	 */
	constructor(parent: QNAP, name: string, sub_items: any, sub_template: any)
	{
		super(parent, name, sub_items, sub_template);
	}
	
	/**
		@abstract Injects content into the template
		@param content - injected content, in this case the note metadata
	 */
	inject = async function(content: any) : Promise<void>
	{
		this._note_meta = content;

		let location = content;
		if (typeof content !== 'string')
			location = this.location;
		
		const json_data = await this.parent.unzip(location + '/noteInfo.json');
		var txt = this.parent.decoder.write(json_data);
        txt = txt.replace(/\\\\/g, '~#~')                            						// special handling for double backslashes
		this._content = JSON.parse(txt);
	}
		
	/**
		@abstract Getter for note location
	 */
	get location()
	{
		return this._note_meta['note_location'];
	}
	
	/**
		@abstract Accessor for the NOTE json object from noteInfo.json
		@returns - Get a ready to use JSON object
		
		Advantage of handling the replacement here is the single responsibility for replacement.
		You will get a ready to use embedded JSON object
	 */
	public get_note_content = async function() : Promise<any>
	{
        var content = this._content['content'];
		content = content.replace(/\\"/g, '"');
        content = content.replace(/~#~/g, '\\');                                // can stem from Qnap.get_note
        var content_data = JSON.parse(content);                                 // this is then a dictionary

		return content_data;
	}
	
	/**
		@abstract Accessor to note content.
	 */
	get note_content() : Promise<any>
	{
		return this.get_note_content();
	}
	
	_note_meta: any;
}


/**
	@abstract This class is responsible for extraction of content from a Qnap Notes Archive
*/
export class QNAP
{
	/**
		@abstract Constructor
	*/
	public constructor(parent: any, archive: string)
	{
		this.parent = parent;
		this.archive_path = archive;
		
		this.decoder = new StringDecoder('utf-8');
	}
        

    /**
		@abstract Gets the structure file from the QNAP archive
		
		The same time stores the structure as state for further usage.
	*/
    public get_archive = async function() : Promise<any>
	{
		const json_data = await this.unzip('data.json');
		const txt = this.decoder.write(json_data);
		const archive = JSON.parse(txt);
		await this._archive.inject(archive);
		
		return this._archive;
	};
	
	/**
		@abstract This Getter seems to work, although not async
	 */
	public get archive() : Promise<any>
	{
		return this.get_archive();
	}
	
	/**
		@abstract Accessor for the note template
	 */
	public get note() : any
	{
		return this._note;
	}
	

	/**
		@abstract Gets a resource file from the QNAP archive
        @param location: note location
        @param kind: kind of resource, maybe 'image' or 'attachment'
        @param id: id of the resource, filename inside the archive
	*/
	public get_resource = async function(location: string, kind: string, id: string) : Promise<any>
	{
        return await this.unzip(location + '/' + kind + '/' + id);
	};
	

	/**
		@abstract Unzips a file from zip archive 
	*/
	unzip = async function(path: string) : Promise<any>
	{
		var zip = new StreamZip.async({ file: this.archive_path });
		const data = await zip.entryData(path);
		await zip.close();
		return data;		
	};
	
	
	parent: any;
	archive_path: string;
	decoder: any;
	
	_tag = new Sub(this, 'tag_name', null, null); 
	_note = new SubNote(this, 'note_name', 'tag_list', this._tag);
	_section = new Sub(this, 'sec_name', 'note_list', this._note);
	_book = new Sub(this, 'nb_name', 'sec_list', this._section);
	_archive = new Sub(this, '', 'notebooks', this._book);
}
