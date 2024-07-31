import {
  mathPlugin,
  mathBackspaceCmd,
  insertMathCmd,
  makeBlockMathInputRule,
  makeInlineMathInputRule,
  REGEX_INLINE_MATH_DOLLARS,
  REGEX_BLOCK_MATH_DOLLARS,
} from '@benrbray/prosemirror-math'
import { history } from 'prosemirror-history'
import { chainCommands, deleteSelection, joinBackward, selectNodeBackward, exitCode } from 'prosemirror-commands'
import { keymap } from 'prosemirror-keymap'
import { inputRules } from 'prosemirror-inputrules'
import { schema } from './Schema'
import { autoLinkInputRulesPlugin } from './AutoLinkInputRule'

// 快捷键换行，主要用于大纲笔记编辑时的换行  插入的 是 <br/> 标签
const fastLineBreak = keymap({
  'Mod-Enter': chainCommands(exitCode, (state, dispatch) => {
    dispatch!(
      state.tr
        .replaceSelectionWith(schema.nodes.hard_break.create())
        .scrollIntoView(),
    )
    return true
  }),
  'Ctrl-Enter': chainCommands(exitCode, (state, dispatch) => {
    dispatch!(
      state.tr
        .replaceSelectionWith(schema.nodes.hard_break.create())
        .scrollIntoView(),
    )
    return true
  }),
})

const mathKeymap = keymap({
  "Mod-Space": insertMathCmd(schema.nodes.math_inline),
  // modify the default keymap chain for backspace
  "Backspace": chainCommands(deleteSelection, mathBackspaceCmd, joinBackward, selectNodeBackward),
})

const mathInputRules = inputRules({
  rules: [
    makeInlineMathInputRule(
      REGEX_INLINE_MATH_DOLLARS,
      schema.nodes.math_inline,
    ),
    makeBlockMathInputRule(
      REGEX_BLOCK_MATH_DOLLARS,
      schema.nodes.math_display,
    )
  ],
})

export const plugins = [fastLineBreak, autoLinkInputRulesPlugin, history(), mathPlugin, mathKeymap, mathInputRules]
