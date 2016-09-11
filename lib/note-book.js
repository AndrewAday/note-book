'use babel';

import NoteBookView from './note-book-view';
import { CompositeDisposable } from 'atom';

export default {

  noteBookView: null,
  modalPanel: null,
  subscriptions: null,
  serving: false,
  socket: null,
  notes: null,
  images: null,
  image_regex: /!\[[^\]]+\]\([^)]+\)/g,

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
    this.socket.close();
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
      var helper = require('./note-book-helper')
      console.log(address)
      // http.createServer(function(req, res) {
      //   res.writeHead(200, {'Content-Type': 'text/plain'})
      //   res.end("Hello World\n")
      // }).listen(8888, ip_address)

      // Update notes
      this.notes = atom.workspace.getActiveTextEditor().getText()
      //Look for markdown image links
      var img_matches = this.notes.match(this.image_regex)
      var directory = helper.getDirectory()
      // base64 encode images
      var encoded_images = []
      var base64 = require('node-base64-image')
      var fs = require('fs')
      for (var i = 0; i < img_matches.length; i++) {
        var relative_path = helper.extractUrl(img_matches[i])
        var img_path = directory + relative_path
        var bitmap = fs.readFileSync(img_path)
        var encoded_img = new Buffer(bitmap).toString('base64')
        encoded_images.push({
          "base64_string": encoded_img,
          // "name": relative_path.substring(relative_path.indexOf('/') + 1)
          "name": relative_path
        })
        // var encoded_img = fs.readFile(img_path, function(err, body) {
        //   if (err) {
        //     console.log('error reading img ' + err)
        //     return
        //   } else {
        //     console.log("HEYO")
        //     var encoded_img = body.toString('base64')
        //     console.log(encoded_img)
        //     return encoded_img
        //   }
        // })
        // console.log(
        //   base64.encode(img_path, {'string': true, 'local': true}, function(err, body) {
        //     return body
        //   }
        // ))
      }
      //TODO: create images file if doesn't exist

      if (this.socket == null) {
        console.log('building socket!')

        var io = require('socket.io');
        var server = http.createServer().listen('8888', ip_address);
        this.socket = io.listen(server)
        this.socket.on('connection', function(s) {
          console.log('a user connected')
          //TODO: send markdown and images
          var data = {
            "markdown": this.notes,
            "images": encoded_images
          }
          this.socket.emit('data', data)
          s.on('image', function(from, msg) {
            console.log('I received a private message by ', from, ' saying ', msg);
          })
          s.on('disconnect', function() {
            console.log('Disconnected')
          })
        })
      }

      var address = 'http://' + ip_address + ':8888/'
      console.log('Socket running at ' + address)
      this.noteBookView.updateQR(ip_address)
      return this.modalPanel.show()
    } else {
      return this.modalPanel.hide()
      // this.socket.close()
      // console.log('socket closed')
      // this.socket = null
    }
  }

};
