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
	*/
    public get_structure = async function() : Promise<any>
	{
		const json_data = await this.unzip('data.json');
		const txt = this.decoder.write(json_data);
		return JSON.parse(txt);
	};
	
	
	/**
		@abstract Gets a note file from the QNAP archive (noteInfo.json)
        @param location: note location
	*/
	public get_note = async function(location: string) : Promise<any>
	{
		const json_data = await this.unzip(location + '/noteInfo.json');
		var txt = this.decoder.write(json_data);
        txt = txt.replace(/\\\\/g, '~#~')                            	// special handling for double backslashes
		return JSON.parse(txt);
	};


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
	public unzip = async function(path: string) : Promise<any>
	{
		var zip = new StreamZip.async({ file: this.archive });
		const data = await zip.entryData(path);
		await zip.close();
		return data;		
	};
	
	
	parent: any;
	archive: string;
	decoder: any;
}
