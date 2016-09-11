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
  boomer_regex: /!\[[\s\S]*?\]!/,
  timeout: null,
  home: null,
  port: '8080',
  image_queue: [],

  activate(state) {
    this.home = atom.workspace.getActiveTextEditor().getPath()
    console.log(this.home)
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
    if (this.timeout != null)
      clearInterval(this.timeout)
    if (this.socket != null)
      this.socket.close();
  },

  serialize() {
    return {
      noteBookViewState: this.noteBookView.serialize()
    };
  },

  toggle() {
    this.serving = !this.serving
    if (this.serving) {
      var http = require('http')
      var ip = require('ip')
      var ip_address = ip.address()
      var helper = require('./note-book-helper')
      // http.createServer(function(req, res) {
      //   res.writeHead(200, {'Content-Type': 'text/plain'})
      //   res.end("Hello World\n")
      // }).listen(8888, ip_address)



      if (this.socket == null) {
        console.log('building socket!')
        var server = require('http').Server();
        var socket = require('socket.io')(server);
        server.listen(this.port)
        // var server = http.createServer().listen('8888', ip_address);
        this.socket = socket
        var self = this
        this.socket.on('connect', function(s) {
          console.log('a user connected')
          self.notes = atom.workspace.getActiveTextEditor().getText()
          //Look for markdown image links
          var img_matches = self.notes.match(self.image_regex)
          if (img_matches == null) {
            img_matches = []
          }
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
              "base64_string": helper.prefixEncodedImage(relative_path, encoded_img),
              "name": relative_path
            })
          }
          //TODO: send markdown and images
          var ack = {
            'request': 'success'
          }
          var data = {
            "markdown": self.notes,
            "images": encoded_images
          }
          // this.modalPanel.hide()
          self.socket.emit('ack', ack)
          console.log(data)
          self.socket.emit('init', data)

          s.on('imageUpdate', function(from, msg) {
            console.log('I received a private message by ', from, ' saying ', msg);
            var img = from.image
            var order = from.order
            var image_dir = helper.getDirectory() + 'images'
            if (!fs.existsSync(image_dir)) {
              fs.mkdirSync(image_dir)
            }
            var buffer = atom.workspace.getActiveTextEditor().getBuffer()
            var count = 0;
            buffer.scan(self.boomer_regex, function(iterator) {
              if (count == order) {
                console.log(iterator.matchText)
                var name = iterator.matchText.substring(2,iterator.matchText.length-2) + '.jpg'
                fs.writeFile(image_dir + '/' + name, new Buffer(img, "base64"), function(err) {
                  if (err != null)
                    console.log('write failed, retry image upload')
                  else {
                    var relative_path = "images/" + name
                    // self.image_queue.push()
                    iterator.replace('![' + name + '](images/' + name + ')')
                    var data =  {
                      "markdown": atom.workspace.getActiveTextEditor().getText(),
                      "images": [{
                        "base64_string": helper.prefixEncodedImage(relative_path, img),
                        "name": relative_path
                      }]
                    }
                    console.log(data)
                    self.socket.emit('data', data)
                  }
                })
              }
              count++
            })
          })
          s.on('disconnect', function() {
            clearInterval(self.timeout)
            self.timeout = null
            console.log('Disconnected')
          })
        })
      }

      var address = 'http://' + ip_address + ':' + this.port + '/'
      console.log('Socket running at ' + address)
      this.noteBookView.updateQR(address.substring(0, address.length-1))
      if (this.timeout == null) {
        var self = this
        this.timeout = setInterval(function() {
          var editor = atom.workspace.getActiveTextEditor()
          if (editor != null) {
            var refreshed_notes = editor.getText()
            var data = {}
            if (self.image_queue.length > 0) {
              data['images'] = self.image_queue
              self.image_queue = []
            }
            if (self.notes != refreshed_notes && atom.workspace.getActiveTextEditor().getPath() == self.home) {
              data["markdown"] = refreshed_notes
              self.notes = refreshed_notes
            }
            if (Object.keys(data).length)
              self.socket.emit('data', data)
          }
        }, 10*1000)
      }
      return this.modalPanel.show()
    } else {
      return this.modalPanel.hide()
    }
  }

};
