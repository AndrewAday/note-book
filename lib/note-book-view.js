'use babel';

export default class NoteBookView {

  constructor(serializedState) {
    // Create root element
    this.element = document.createElement('div');
    this.element.classList.add('note-book');

    // Create message element
    const message = document.createElement('div');
    message.textContent = 'Scan QR code to connect!';
    message.classList.add('message');
    this.element.appendChild(message);
  }

  // Returns an object that can be retrieved when package is activated
  serialize() {}

  // Tear down any state and detach
  destroy() {
    this.element.remove();
  }

  updateQR(ip_address) {
    if (ip_address != null) {
      var qrcode = require('qrcode-js');
      encoded_qr = qrcode.toDataURL(ip_address, 4)
      console.log(encoded_qr)
      var view_helper = require('./note-book-view-helper')
      var img = view_helper.create_image(encoded_qr, 'QR FAILED TO LOAD', 'Scan to connect')
      img.className = 'qr-code'
      if (this.element.children.length > 1)
        this.element.removeChild(this.element.lastChild)


      var container = document.createElement('div')
      container.className = 'container'
      container.appendChild(img)

      this.element.appendChild(container)

      console.log(img)
    }
  }

  getElement() {
    return this.element;
  }

}
