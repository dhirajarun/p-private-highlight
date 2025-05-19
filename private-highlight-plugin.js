import { Plugin, PluginKey } from 'prosemirror-state'
import { absolutePositionToRelativePosition, relativePositionToAbsolutePosition,  ySyncPluginKey} from "y-prosemirror"
import { Decoration, DecorationSet } from 'prosemirror-view'

const privateHighlightPluginKey = new PluginKey('privateHighlight')

const privateHighlights = new Map()

export function privateHighlightPlugin(options) {
  const { ydoc, fieldName } = options
  const fragment = ydoc.getXmlFragment(fieldName)

  const privateHighlightPlugin = new Plugin({
    key: privateHighlightPluginKey,
    state: {
      init() {
        return {
          decorations: DecorationSet.empty,
        }
      },
      apply(tr, { decorations }, oldState, newState) {
        const syncChange = tr.getMeta(ySyncPluginKey)
        const hightlightChange = tr.getMeta(privateHighlightPluginKey)

        if (!tr.docChanged && !syncChange && !hightlightChange) {
          return {
            decorations
          }
        }

        if (!syncChange && !hightlightChange) {
          return {
            decorations: decorations?.map(tr.mapping, tr.doc)
          }
        }

        const ystate = ySyncPluginKey.getState(newState)
        const mapping = ystate?.binding?.mapping

        if (!mapping) {
          return {
            decorations: decorations?.map(tr.mapping, tr.doc)
          }
        }

        const decos = []

        for (const [highlightId, highlight] of privateHighlights) {
          const { from, to } = highlight

          const range = {
            from: relativePositionToAbsolutePosition(ydoc, fragment, from, mapping),
            to: relativePositionToAbsolutePosition(ydoc, fragment, to, mapping)
          }

          if (range.from === range.to) {
            // This occurs, when a prosemirror node is splitted before the highlight
            const spec = decorations.find(undefined, undefined, (spec) => spec.id === highlight.id)[0]

            continue;
          }

          decos.push(Decoration.inline(range.from, range.to, { class: 'highlight', style: "background-color: red" }, {
            id: highlightId
          }))
        }

        return {
          decorations: DecorationSet.create(tr.doc, decos)
        }
      }
    },
    props: {
      decorations(state) {
        return this.getState(state).decorations
      }
    }
  })

  return privateHighlightPlugin
}

export function setPrivateHighlights({ fragment }) {
  return (state, dispatch) => {
    const { tr } = state

    const id = Math.random().toString(36).substring(2, 15)

    const ystate = ySyncPluginKey.getState(state)
    const mapping = ystate?.binding?.mapping

    if (!mapping) {
      return
    }

    privateHighlights.set(id, {
      id,
      from: absolutePositionToRelativePosition(state.selection.from, fragment, mapping),
      to: absolutePositionToRelativePosition(state.selection.to, fragment, mapping)
    })

    console.log("pos", state.selection.from, JSON.stringify(absolutePositionToRelativePosition(state.selection.from, fragment, mapping)))

    tr.setMeta(privateHighlightPluginKey, true)
    dispatch(tr)
  }
}
