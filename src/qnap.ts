const StreamZip = require('node-stream-zip')
const { StringDecoder } = require('string_decoder');
	

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
		this.archive = archive;
		
		this.decoder = new StringDecoder('utf-8');
	}
        

    /**
		@abstract Gets the structure file from the QNAP archive
		
		The same time stores the structure as state for further usage.
	*/
    public get_structure = async function() : Promise<any>
	{
		const json_data = await this.unzip('data.json');
		const txt = this.decoder.write(json_data);
		const structure = JSON.parse(txt);
		this._structure = structure;
		
		return this._structure;
	};
	
	/**
		@abstract This Getter seems to work, although not async
	 */
	public get structure() : Promise<any>
	{
		return this.get_structure();
	}
	
	async test()
	{
		await this.structure;
	}
	
	
	/**
		@abstract Returns the Notebooks array of the internal archive structure
	 */
	private get_books = function*() : any
	{
		for (let book of this._structure['notebooks'])
		{
			this.book = book;
			yield book;
		}
	}
	
	/**
		@abstract Getter for get_books generator
	 */
	public get books()
	{
		return this.get_books();
	}
	
	/**
		@abstract Getter for the notebook name
	 */
	public get book_name()
	{
		return this.book['nb_name'];
	}
	
	/**
		@abstract Getter for notebook times (create time, update time)
	 */
	public get book_time()
	{
		return [ this.book.create_time, this.book.update_time ];
	}
	
	
	/**
		@abstract Returns the Section array of the internal book object
	 */
	private get_sections = function*() : any
	{
		for (let section of this.book['sec_list'])
		{
			this.section = section;
			yield section;
		}
	}
	
	/**
		@abstract Getter for get_sections generator
	 */
	public get sections()
	{
		return this.get_sections();
	}
	
	/**
		@abstract Getter for the setion name
	 */
	public get section_name()
	{
		return this.section['sec_name'];
	}
	
	/**
		@abstract Getter for section times (create time, update time)
	 */
	public get section_time()
	{
		return [ this.section.create_time, this.section.update_time ];
	}
	
		
	/**
		@abstract Returns the Section array of the internal book object
	 */
	private get_notes = function*() : any
	{
		for (let note of this.section['note_list'])
		{
			this.note_meta = note;
			yield note;
		}
	}
	
	/**
		@abstract Getter for get_notes generator
	 */
	public get notes()
	{
		return this.get_notes();
	}
	
	/**
		@abstract Getter for the note location
	 */
	public get note_location()
	{
		return this.note_meta['note_location'];
	}
	
	
	/**
		@abstract Gets a note file from the QNAP archive (noteInfo.json)
        @param location: note location
	*/
	public get_note = async function(location: string) : Promise<any>
	{
		const json_data = await this.unzip(location + '/noteInfo.json');
		var txt = this.decoder.write(json_data);
        txt = txt.replace(/\\\\/g, '~#~')                            				// special handling for double backslashes
		this.note = JSON.parse(txt);
		
		return this.note;
	};

	
	/**
		@abstract Accessor for the NOTE json object from noteInfo.json
		@param idx - index (prop) to access the JSON content
		@returns - for idx = 'content' get a ready to use JSON object
		
		Advantage of handling the replacement here is the single responsibility for replacement.
		TODO: To apply replace each note_file[idx] in Importer by qnap.get_note_elem(idx). 
		You will get a ready to use embedded JSON object
	 */
	public get_note_elem = function(idx: string) : any
	{
		if (idx == 'content')
		{
	        var content = this.note[idx];
			content = content.replace(/\\"/g, '"');
	        content = content.replace(/~#~/g, '\\');                                // can stem from Qnap.get_note
	        var content_data = JSON.parse(content);                                 // this is then a dictionary

			return content_data;
		}
		
		return this.note[idx];
	}
	
	/**
		@abstract Getter for the note name
	 */
	public get note_name()
	{
		return this.note['note_name'];
	}
	
	/**
		@abstract Getter for note times (create time, update time)
	 */
	public get note_time()
	{
		return [ this.note.create_time, this.note.update_time ];
	}
	
	/**
		@abstract Generator of the note's tags 
	 */
	private get_tags = function*() : any
	{
		for (let tag of this.note['tag_list'])
		{
			this.tag = tag;
			yield tag;
		}
	}
	
	/**
		@abstract Getter for the note's tags
	 */
	public get tags() : any
	{
		return this.get_tags();
	}
	
	/**
		@abstract Getter for the tag name
	 */
	public get tag_name()
	{
		return this.tag['tag_name'];
	}
	
	/**
		@abstract Getter for tag times (create time, update time)
	 */
	public get tag_time()
	{
		return [ this.tag.create_time, this.tag.update_time ];
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
		var zip = new StreamZip.async({ file: this.archive });
		const data = await zip.entryData(path);
		await zip.close();
		return data;		
	};
	
	
	parent: any;
	archive: string;
	decoder: any;
	
	_structure: any;
	book: any;
	section: any;
	note_meta: any;
	note: any;
	tag: any;
}
