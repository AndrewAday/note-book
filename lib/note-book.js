'use babel';

import NoteBookView from './note-book-view';
import { CompositeDisposable } from 'atom';

export default {

  noteBookView: null,
  modalPanel: null,
  subscriptions: null,
  serving: false,
  socket: null,

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
    this.serving = !this.serving
    console.log(this.serving)
    if (this.serving) {
      var http = require('http')
      var ip = require('ip')
      var ip_address = ip.address()
      console.log(address)
      // http.createServer(function(req, res) {
      //   res.writeHead(200, {'Content-Type': 'text/plain'})
      //   res.end("Hello World\n")
      // }).listen(8888, ip_address)

      var io = require('socket.io');
      var server = http.createServer().listen('80', ip_address);
      this.socket = io.listen(server)
      this.socket.on('connection', function(s) {
        io.emit('data')
      })





      var address = 'http://' + address + ':80/'
      console.log('Socket running at ' + address)
      this.noteBookView.updateQR(ip_address)
      return (
        this.modalPanel.isVisible() ?
        this.modalPanel.hide() :
        this.modalPanel.show()
      );
    } else {
      this.socket.close()
      this.socket = null
    }
  }

};
