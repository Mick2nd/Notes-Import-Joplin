import joplin from 'api';
import { QNAP } from './qnap';
import { Joplin } from './joplin';


/**
	@abstract The class responsible for importing the Qnap Notes Archive
 */
export class Importer
{
	public constructor(archive: string)
	{
		this.qnap = new QNAP(this, archive);
		this.joplin = new Joplin(this);
	}
	
	/**
		@abstract Imports the archive
        - Extracts the relevant files from archive
        - Inserts them into Joplin by using the Joplin Data API 
	 */
	public import_it = async function() : Promise<void>
	{
        const archive_structure = await this.qnap.get_structure();
		const folder = await joplin.workspace.selectedFolder();
        
        for (var book of archive_structure['notebooks'])                                             	// all note books
		{
            const nb_name = book['nb_name'];
            const nb_data = await this.joplin.put_folder(folder.id, nb_name);                      		// put it as folder
            const nb_id = nb_data['id'];
            // this.logger.info(nb_name)
            // this.refresh()                                                                      		// refreshes the GUI
            
            for (var section of book['sec_list'])                                                    	// all sections in note book
			{
                const sec_name = section['sec_name'];
                const sec_data = await this.joplin.put_folder(nb_id, sec_name);                         // put it as folder
                const sec_id = sec_data['id'];
                // this.logger.info(f'- {sec_name}')
                // this.refresh()                                                                  		// refreshes the GUI
            
                for (var note of section['note_list'])                                               	// all notes in section
				{
                    const location = note['note_location'];
                    const note_file = await this.qnap.get_note(location);
                    const note_name = note_file['note_name'];
                    const note_content = note_file['content'];
                    var md = await this.convert_note(location, note_content);                           // convert the content to mark down
                    const resp = await this.joplin.put_note(sec_id, note_name, md);                     // put the note
                    // this.logger.info(f'-- {note_name}')
                    // this.refresh()                                                              		// refreshes the GUI
        
                    for (var tag of note_file['tag_list'])
					{
                        await this.joplin.put_tag(resp['id'], tag['tag_name'])
                        // this.logger.info(f'--- tag: {tag["tag_name"]}')
                        // this.refresh()                                                              	// refreshes the GUI
					}
				}
			}
		}
	}
	
	/**
		@abstract Inserts a probe note
	 */
	public probe = async function() : Promise<void>
	{
        // done:
		// 1/4/2	Übersicht über Arbeiten zur Noethertheorie
        // 1/1/4    Identity Levi-Civita-Symbol
        // 2/1/1    Nächste Zeit
        // 1/1/1    Operator- und Matrixfunktionen
        // 2/4/5    Verkäufe ?
        // 2/4/1    Anschaffungen ?
		const folder = await joplin.workspace.selectedFolder();
        const location = '1/4/2';
        const note_file = await this.qnap.get_note(location);
        const note_name = note_file['note_name'];
        const note_content = note_file['content'];
        var md = await this.convert_note(location, note_content);
        const resp = await this.joplin.put_note(folder.id, note_name, md);
        
        for (var tag of note_file['tag_list'])
            await this.joplin.put_tag(resp['id'], tag['tag_name']);
        
        // this.logger.info('Probe successfully converted')
	}

	/**
		@abstract Converts a QNAP Note in mark-down format
        @param location: location of the note
        @param content: the content of a note (raw)
	 */
	public convert_note = async function(location: string, content: string) : Promise<string>
	{
		var inst = this;

		/**
			@abstract Converts common content
		 */
        const convert_content = async function(content: any, quotation: number = 0) : Promise<string>
		{
            var md = '';
            for (var item of content)
			{
                var item_md = '';
                if (item['type'] == 'table')
                    item_md = await convert_table(item);
                if (item['type'] == 'paragraph')
                    item_md = await convert_para(item);
                if (item['type'] == 'heading')
                    item_md = await convert_heading(item);
                if (item['type'] == 'check_list')
                    item_md = await convert_check_list(item);
                if (item['type'] == 'bullet_list')
                    item_md = await convert_list(item, '- ');
                if (item['type'] == 'ordered_list')
                    item_md = await convert_list(item, '1. ');
                if (item['type'] == 'horizontal_rule')
                    item_md = '---\n';
                if (item['type'] == 'blockquote')
                    item_md = await convert_content(item['content'], quotation + 1);
                if (item['type'] == 'code_block')
                    item_md = await convert_code(item);
                    
                md = md + '>'.repeat(quotation) + item_md + '\n';
			}
        
            return md
        }   
        
		/**
			@abstract Converts a table
		 */
		const convert_table = async function(table: any) : Promise<string>
		{
            var divider = [''];
            var first = true;
            var rows = [];
            
            for (var row of table['content'])
			{
                var cells = [''];
                
                for (var cell of row['content'])
				{
                    for (var para of cell['content'])
                        cells.push(await convert_para(para));
                }        
                cells.push('');
                var row_md = cells.join('|');
                rows.push(row_md);
                
                if (first)
				{
					const length = row['content'].length;
					const array = Array.from({length: length}, i => '-');
                    divider = divider.concat(array);
                    divider.push('');
                    var divider_md = divider.join('|');
                    rows.push(divider_md);
                    first = false
				}
			}
                    
            return rows.join('\n');
		}
		
		/**
			@abstract Converts a paragraph
		 */
		const convert_para = async function(para: any) : Promise<string>
		{
            var md = '';
            for (var item of para.content || [])
			{
                if (item == null)
                    continue;
                if (item['type'] == 'text')
                    md += await convert_text(item);
                if (item['type'] == 'file')
                    md += await convert_file(item);
                if (item['type'] == 'image')
                    md += await convert_file(item, 'image');
                if (item['type'] == 'hard_break')
                    md += '<br/>';
			}
            
            return md
		}
		
		/**
			@abstract Converts a heading
		 */
		const convert_heading = async function(heading: any) : Promise<string>
		{
            const level = heading['attrs']['level'];
            const txt = await convert_text(heading['content'][0]);
            return '#'.repeat(level) + ' ' + txt;
		}
		
		/**
			@abstract Converts a check list
		 */
		const convert_check_list = async function(check_list: any, level: number = 0) : Promise<string>
		{
            var md = '';
            for (var item of check_list['content'])
			{
                const checked = item['attrs']['checked'] ? 'x' : ' ';
                var txt = '';
                for (var para of item['content'])
                    txt += await convert_para(para);
                    
                md += '\t'.repeat(level) + `- [${checked}] ` + txt + '\n';
			}
                
            return md;
		}
		
		/**
			@abstract Converts a list (bullet or ordered)
		 */
		const convert_list = async function(list: any, pattern: string, level: number = 0) : Promise<string>
		{
            var md = '';
            for (var item of list['content'])
			{
                for (var nested of item['content'])                              // assumed to be 1 item inside list_item
				{
                    if (nested['type'] == 'paragraph')
                        var txt = await convert_para(nested);
                        md += '\t'.repeat(level) + pattern + txt + '\n';
                        
                    if (nested['type'] == 'bullet_list')
                        md += await convert_list(nested, '- ', level + 1);
                    if (nested['type'] == 'ordered_list')
                        md += await convert_list(nested, '1. ', level + 1);
                    if (nested['type'] == 'check_list')
                        md += await convert_check_list(nested, level + 1);
				}
			}
                        
            return md
		}
		
		/**
			@abstract Converts a code block
		 */
		const convert_code = async function(code: any) : Promise<string>
		{
            var md = '';
            for (var item of code.content || [])
			{
                if (item == null)
                    continue;
                if (item['type'] == 'text')
                    md += await convert_text(item);
			}
            
            return '```\n' + md + '```';
		}
	
		/**
			@abstract Converts text
		 */
		const convert_text = async function(text: any) : Promise<string>
		{
            var pure_text = text['text'];
            const marks = text.marks || [];
            var marks_string = '';
            for (var mark of marks)
			{
                if (mark['type'] == 'em')
                    marks_string += '*';
                if (mark['type'] == 'strong')
                    marks_string += '**';
                if (mark['type'] == 'superscript')
                    marks_string += '^';
                if (mark['type'] == 'subscript')
                    marks_string += '~'
                if (mark['type'] == 'link')
				{
                    const href = mark['attrs']['href'];
                    pure_text = `[${pure_text}](${href})`;
				}
			}
            
            return marks_string + pure_text + marks_string;
		}
		
		/**
			@abstract Converts a file entry and posts the file
		 */
		const convert_file = async function(file: any, kind: string = 'attachment') : Promise<string>
		{
            var src = file['attrs']['src'].split('/');
            src = src.slice(-1)[0];															// TODO: test
            const title = file['attrs']['title'];
            var meta_data = { 'title': title }
            const content = await inst.qnap.get_resource(location, kind, src)               // first get the attachment from Qnap

            const resp = await inst.joplin.put_resource(meta_data, content);            
            const sign = kind == 'attachment' ? '' : '!';
            
            return `${sign}[${title}](:/${resp["id"]})`;                               		// finally return the md
		}
		
		
        content = content.replace(/\\"/g, '"');
        content = content.replace(/~#~/g, '\\');                                          	// can stem from Qnap.get_note
        var content_data = JSON.parse(content);                                             // this is then a dictionary
        var md = convert_content(content_data['content']);
    
        return md;
	}

	qnap: QNAP;
	joplin: Joplin;
}
