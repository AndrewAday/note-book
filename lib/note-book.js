'use babel';

import NoteBookView from './note-book-view';
import { CompositeDisposable } from 'atom';

export default {

  noteBookView: null,
  modalPanel: null,
  subscriptions: null,

  activate(state) {
    this.noteBookView = new NoteBookView(state.noteBookViewState);
    this.modalPanel = atom.workspace.addModalPanel({
      item: this.noteBookView.getElement(),
      visible: false
    });

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'note-book:toggle': () => this.toggle()
    }));
  },

  deactivate() {
    this.modalPanel.destroy();
    this.subscriptions.dispose();
    this.noteBookView.destroy();
  },

  serialize() {
    return {
      noteBookViewState: this.noteBookView.serialize()
    };
  },

  toggle() {
    console.log('NoteBook was toggled!');
    return (
      this.modalPanel.isVisible() ?
      this.modalPanel.hide() :
      this.modalPanel.show()
    );
  }

};
