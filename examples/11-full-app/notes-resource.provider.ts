import { Injectable } from '@nestjs/common';
import { McpResource } from '../../src';
import { NotesService } from './notes.service';

@Injectable()
export class NotesResourceProvider {
  constructor(private readonly notes: NotesService) {}

  @McpResource({
    uri: 'notes://all',
    name: 'all_notes',
    description: 'All notes in the system',
    mimeType: 'application/json',
  })
  async getAllNotes() {
    const notes = this.notes.getAllNotes();
    return {
      contents: [{
        uri: 'notes://all',
        mimeType: 'application/json',
        text: JSON.stringify(notes, null, 2),
      }],
    };
  }

  @McpResource({
    uriTemplate: 'notes://{noteId}',
    name: 'note_by_id',
    description: 'Get a single note by its ID',
    mimeType: 'application/json',
  })
  async getNoteById(uri: string) {
    const match = uri.match(/notes:\/\/(\d+)/);
    const id = match ? parseInt(match[1]) : -1;
    const note = this.notes.getNoteById(id);

    if (!note) {
      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: JSON.stringify({ error: `Note ${id} not found` }),
        }],
      };
    }

    return {
      contents: [{
        uri,
        mimeType: 'application/json',
        text: JSON.stringify(note, null, 2),
      }],
    };
  }

  @McpResource({
    uri: 'notes://tags',
    name: 'all_tags',
    description: 'List of all unique tags across notes',
    mimeType: 'application/json',
  })
  async getAllTags() {
    const allTags = new Set<string>();
    for (const note of this.notes.getAllNotes()) {
      note.tags.forEach(t => allTags.add(t));
    }
    return {
      contents: [{
        uri: 'notes://tags',
        mimeType: 'application/json',
        text: JSON.stringify({ tags: Array.from(allTags).sort() }, null, 2),
      }],
    };
  }
}
