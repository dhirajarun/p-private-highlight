/* eslint-env browser */

import * as Y from 'yjs'
import { WebrtcProvider } from 'y-webrtc'
import { ySyncPlugin, yCursorPlugin, yUndoPlugin, undo, redo, initProseMirrorDoc } from 'y-prosemirror'
import { EditorState } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'
import { schema } from './schema.js'
import { exampleSetup } from 'prosemirror-example-setup'
import { keymap } from 'prosemirror-keymap'
import { privateHighlightPlugin, setPrivateHighlights } from './private-highlight-plugin.js'


window.addEventListener('load', () => {
  const ydoc = new Y.Doc()
  const provider = new WebrtcProvider('prosemirror-debug', ydoc)
  const type = ydoc.getXmlFragment('prosemirror')

  const editor = document.createElement('div')
  editor.setAttribute('id', 'editor')
  const editorContainer = document.createElement('div')
  editorContainer.insertBefore(editor, null)
  const { doc, mapping } = initProseMirrorDoc(type, schema)

  const prosemirrorView = new EditorView(editor, {
    state: EditorState.create({
      doc,
      schema,
      plugins: [
        ySyncPlugin(type, { mapping }),
        yCursorPlugin(provider.awareness),
        yUndoPlugin(),
        keymap({
          'Mod-z': undo,
          'Mod-y': redo,
          'Mod-Shift-z': redo
        }),
        privateHighlightPlugin({ ydoc, fieldName: 'prosemirror' }),
      ].concat(exampleSetup({ schema }))
    })
  })
  document.body.insertBefore(editorContainer, null)

  setTimeout(() => {
    prosemirrorView.focus()
  })

  const connectBtn = /** @type {HTMLElement} */ (document.getElementById('y-connect-btn'))
  connectBtn.addEventListener('click', () => {
    if (provider.shouldConnect) {
      provider.disconnect()
      connectBtn.textContent = 'Connect'
    } else {
      provider.connect()
      connectBtn.textContent = 'Disconnect'
    }
  })

  const setPrivateHighlightBtn = /** @type {HTMLElement} */ (document.getElementById('set-private-highlight'))
  setPrivateHighlightBtn.addEventListener('click', () => {
    setPrivateHighlights({ fragment: type })(prosemirrorView.state, prosemirrorView.dispatch)
  })

  // @ts-ignore
  window.example = { provider, ydoc, type, prosemirrorView }
})
