/*
    highlight.c - JavaScript syntax highlighting
    Copyright (C) 2008 siliconforks.com

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along
    with this program; if not, write to the Free Software Foundation, Inc.,
    51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
*/

#include <config.h>

#include "highlight.h"

#include <stdlib.h>
#include <string.h>

#include <jslock.h>
#include <jsscan.h>

#include "util.h"

enum Class {
  CLASS_NONE,
  CLASS_COMMENT,
  CLASS_REGEXP,
  CLASS_NUMBER,
  CLASS_STRING,
  CLASS_SPECIALCHAR,
  CLASS_KEYWORD,
  CLASS_TYPE,
  CLASS_SYMBOL,
  CLASS_CBRACKET
};

static const char * get_class_name(enum Class class) {
  switch (class) {
  case CLASS_NONE:
    abort();
    break;
  case CLASS_COMMENT:
    return "c";
    break;
  case CLASS_REGEXP:
    return "s";
    break;
  case CLASS_NUMBER:
    return "s";
    break;
  case CLASS_STRING:
    return "s";
    break;
  case CLASS_SPECIALCHAR:
    return "t";
    break;
  case CLASS_KEYWORD:
    return "k";
    break;
  case CLASS_TYPE:
    return "k";
    break;
  case CLASS_SYMBOL:
    return "k";
    break;
  case CLASS_CBRACKET:
    return "k";
    break;
  default:
    abort();
    break;
  }
}

static enum Class ** classes = NULL;
static jschar ** lines = NULL;

static uint16_t num_characters_in_line(jschar * line) {
  uint16_t result = 0;
  while (line[result] != '\0') {
    result++;
  }
  return result;
}

static void mark_token_chars(enum Class class, uint16_t start_line, uint16_t start_column, uint16_t end_line, uint16_t end_column) {
  for (uint16_t i = start_line; i <= end_line; i++) {
    uint16_t c1 = i == start_line? start_column: 0;
    uint16_t c2 = i == end_line? end_column: num_characters_in_line(lines[i - 1]);
    for (uint16_t j = c1; j < c2; j++) {
      classes[i - 1][j] = class;
    }
  }
}

static void mark_nontoken_chars(uint16_t start_line, uint16_t start_column, uint16_t end_line, uint16_t end_column) {
  enum State {
    STATE_NORMAL,
    STATE_LINE_COMMENT,
    STATE_MULTILINE_COMMENT
  };

  enum State state = STATE_NORMAL;
  for (uint16_t i = start_line; i <= end_line; i++) {
    uint16_t c1 = i == start_line? start_column: 0;
    uint16_t c2 = i == end_line? end_column: num_characters_in_line(lines[i - 1]);
    for (uint16_t j = c1; j < c2; j++) {
      jschar c = lines[i - 1][j];
      switch (state) {
      case STATE_NORMAL:
        if (c == '/' && j + 1 < c2 && lines[i - 1][j + 1] == '/') {
          state = STATE_LINE_COMMENT;
          classes[i - 1][j] = CLASS_COMMENT;
        }
        else if (c == '/' && j + 1 < c2 && lines[i - 1][j + 1] == '*') {
          state = STATE_MULTILINE_COMMENT;
          classes[i - 1][j] = CLASS_COMMENT;
          j++;
          classes[i - 1][j] = CLASS_COMMENT;
        }
        else {
          classes[i - 1][j] = CLASS_NONE;
        }
        break;
      case STATE_LINE_COMMENT:
        if (c == '\r' || c == '\n' || c == 0x2028 || c == 0x2029) {
          state = STATE_NORMAL;
          classes[i - 1][j] = CLASS_NONE;
        }
        else {
          classes[i - 1][j] = CLASS_COMMENT;
        }
        break;
      case STATE_MULTILINE_COMMENT:
        classes[i - 1][j] = CLASS_COMMENT;
        if (c == '*' && j + 1 < c2 && lines[i - 1][j + 1] == '/') {
          j++;
          classes[i - 1][j] = CLASS_COMMENT;
          state = STATE_NORMAL;
        }
        break;
      }
    }
    /* end of the line */
    if (state == STATE_LINE_COMMENT) {
      state = STATE_NORMAL;
    }
  }
}

void jscoverage_highlight_js(JSContext * context, const char * id, const jschar * characters, size_t num_characters, Stream * output) {
  /* count the lines - see GetChar in jsscan.c */
  size_t i = 0;
  uint16_t num_lines = 0;
  while (i < num_characters) {
    if (num_lines == UINT16_MAX) {
      fatal("%s: script has more than 65535 lines", id);
    }
    num_lines++;
    jschar c;
    while (i < num_characters) {
      c = characters[i];
      if (c == '\0') {
        fatal("%s: script contains NULL character", id);
      }
      if (c == '\r' || c == '\n' || c == 0x2028 || c == 0x2029) {
        break;
      }
      i++;
    }
    if (i < num_characters) {
      i++;
      if (c == '\r' && i < num_characters && characters[i] == '\n') {
        i++;
      }
    }
  }

  lines = xnew(jschar *, num_lines);
  classes = xnew(enum Class *, num_lines);

  uint16_t line_num = 0;
  i = 0;
  while (i < num_characters) {
    size_t line_start = i;
    jschar c;
    while (i < num_characters) {
      c = characters[i];
      if (c == '\r' || c == '\n' || c == 0x2028 || c == 0x2029) {
        break;
      }
      i++;
    }
    size_t line_end = i;
    if (i < num_characters) {
      i++;
      if (c == '\r' && i < num_characters && characters[i] == '\n') {
        i++;
      }
    }
    size_t line_length = line_end - line_start;
    if (line_length >= UINT16_MAX) {
      fatal("%s: script has line with 65535 characters or more", id);
    }
    jschar * line = xnew(jschar, line_length + 1);
    memcpy(line, characters + line_start, sizeof(jschar) * line_length);
    line[line_length] = '\0';
    lines[line_num] = line;
    classes[line_num] = xnew(enum Class, line_length);
    line_num++;
  }

  /* tokenize the JavaScript */
  JSTokenStream * token_stream = js_NewTokenStream(context, characters, num_characters, NULL, 1, NULL);
  if (token_stream == NULL) {
    fatal("cannot create token stream from JavaScript file %s", id);
  }

    /* see js_ParseTokenStream in jsparse.c */
    JSObject * chain = NULL;
    JSContext * cx = context;
    JSStackFrame *fp, frame;

    /*
     * Push a compiler frame if we have no frames, or if the top frame is a
     * lightweight function activation, or if its scope chain doesn't match
     * the one passed to us.
     */
    fp = cx->fp;
    if (!fp || !fp->varobj || fp->scopeChain != chain) {
        memset(&frame, 0, sizeof frame);
        frame.varobj = frame.scopeChain = chain;
        if (cx->options & JSOPTION_VAROBJFIX) {
            while ((chain = JS_GetParent(cx, chain)) != NULL)
                frame.varobj = chain;
        }
        frame.down = fp;
        if (fp)
            frame.flags = fp->flags & (JSFRAME_SPECIAL | JSFRAME_COMPILE_N_GO);
        cx->fp = &frame;
    }

    /*
     * Protect atoms from being collected by a GC activation, which might
     * - nest on this thread due to out of memory (the so-called "last ditch"
     *   GC attempted within js_NewGCThing), or
     * - run for any reason on another thread if this thread is suspended on
     *   an object lock before it finishes generating bytecode into a script
     *   protected from the GC by a root or a stack frame reference.
     */
    JS_KEEP_ATOMS(cx->runtime);

  line_num = 1;
  uint16_t column_num = 0;
  for (;;) {
    JSTokenType tt = js_GetToken(context, token_stream);

    if (tt == TOK_ERROR) {
      fatal("JavaScript parse error: %s: line = %d, col = %d\n", id, line_num, column_num);
    }

    if (tt == TOK_EOF) {
      /* it seems t.pos is invalid for TOK_EOF??? */
      /* mark the remaining chars */
      if (num_lines == 0) {
        break;
      }
      uint16_t end_line = num_lines;
      uint16_t end_column = num_characters_in_line(lines[num_lines - 1]);
      mark_nontoken_chars(line_num, column_num, end_line, end_column);
      break;
    }

    /* mark the chars before the token */
    JSToken t = CURRENT_TOKEN(token_stream);
    mark_nontoken_chars(line_num, column_num, t.pos.begin.lineno, t.pos.begin.index);

    /* mark the token */
    enum Class class;
    switch (tt) {
    case TOK_ERROR:
    case TOK_EOF:
      abort();
    case TOK_EOL:
      class = CLASS_NONE;
      token_stream->flags |= TSF_OPERAND;
      break;
    case TOK_SEMI:
    case TOK_COMMA:
    case TOK_ASSIGN:
    case TOK_HOOK:
    case TOK_COLON:
    case TOK_OR:
    case TOK_AND:
    case TOK_BITOR:
    case TOK_BITXOR:
    case TOK_BITAND:
    case TOK_EQOP:
    case TOK_RELOP:
    case TOK_SHOP:
    case TOK_PLUS:
    case TOK_MINUS:
    case TOK_STAR:
    case TOK_DIVOP:
      class = CLASS_SYMBOL;
      token_stream->flags |= TSF_OPERAND;
      break;
    case TOK_UNARYOP:
      switch (t.t_op) {
      case JSOP_NEG:
      case JSOP_POS:
      case JSOP_NOT:
      case JSOP_BITNOT:
        class = CLASS_SYMBOL;
        token_stream->flags |= TSF_OPERAND;
        break;
      case JSOP_TYPEOF:
        class = CLASS_KEYWORD;
        token_stream->flags |= TSF_OPERAND;
        break;
      case JSOP_VOID:
        class = CLASS_TYPE;
        token_stream->flags |= TSF_OPERAND;
        break;
      default:
        abort();
      }
      break;
    case TOK_INC:
    case TOK_DEC:
    case TOK_DOT:
    case TOK_LB:
      class = CLASS_SYMBOL;
      token_stream->flags |= TSF_OPERAND;
      break;
    case TOK_RB:
      class = CLASS_SYMBOL;
      token_stream->flags &= ~TSF_OPERAND;
      break;
    case TOK_LC:
      class = CLASS_CBRACKET;
      token_stream->flags |= TSF_OPERAND;
      break;
    case TOK_RC:
      class = CLASS_CBRACKET;
      token_stream->flags &= ~TSF_OPERAND;
      break;
    case TOK_LP:
      class = CLASS_SYMBOL;
      token_stream->flags |= TSF_OPERAND;
      break;
    case TOK_RP:
      class = CLASS_SYMBOL;
      token_stream->flags &= ~TSF_OPERAND;
      break;
    case TOK_NAME:
      class = CLASS_NONE;
      token_stream->flags &= ~TSF_OPERAND;
      if (js_PeekToken(context, token_stream) == TOK_LP) {
        /* function */
        class = CLASS_NONE;
      }
      break;
    case TOK_NUMBER:
      class = CLASS_NUMBER;
      token_stream->flags &= ~TSF_OPERAND;
      break;
    case TOK_STRING:
      class = CLASS_STRING;
      token_stream->flags &= ~TSF_OPERAND;
      break;
    case TOK_OBJECT:
      class = CLASS_REGEXP;
      token_stream->flags &= ~TSF_OPERAND;
      break;
    case TOK_PRIMARY:
      switch (t.t_op) {
      case JSOP_TRUE:
      case JSOP_FALSE:
      case JSOP_NULL:
      case JSOP_THIS:
        class = CLASS_KEYWORD;
        token_stream->flags &= ~TSF_OPERAND;
        break;
      default:
        abort();
      }
      break;
    case TOK_FUNCTION:
      class = CLASS_KEYWORD;
      token_stream->flags |= TSF_OPERAND;
      break;
    case TOK_EXPORT:
    case TOK_IMPORT:
      abort();
      break;
    case TOK_IF:
    case TOK_ELSE:
    case TOK_SWITCH:
    case TOK_CASE:
    case TOK_DEFAULT:
    case TOK_WHILE:
    case TOK_DO:
    case TOK_FOR:
    case TOK_BREAK:
    case TOK_CONTINUE:
    case TOK_IN:
    case TOK_VAR:
    case TOK_WITH:
    case TOK_RETURN:
    case TOK_NEW:
    case TOK_DELETE:
      token_stream->flags |= TSF_OPERAND;
      class = CLASS_KEYWORD;
      break;
    case TOK_DEFSHARP:
    case TOK_USESHARP:
      abort();
      break;
    case TOK_TRY:
    case TOK_CATCH:
    case TOK_FINALLY:
    case TOK_THROW:
    case TOK_INSTANCEOF:
    case TOK_DEBUGGER:
      token_stream->flags |= TSF_OPERAND;
      class = CLASS_KEYWORD;
      break;
    case TOK_XMLSTAGO:
    case TOK_XMLETAGO:
    case TOK_XMLPTAGC:
    case TOK_XMLTAGC:
    case TOK_XMLNAME:
    case TOK_XMLATTR:
    case TOK_XMLSPACE:
    case TOK_XMLTEXT:
    case TOK_XMLCOMMENT:
    case TOK_XMLCDATA:
    case TOK_XMLPI:
    case TOK_AT:
    case TOK_DBLCOLON:
    case TOK_ANYNAME:
    case TOK_DBLDOT:
    case TOK_FILTER:
    case TOK_XMLELEM:
    case TOK_XMLLIST:
    case TOK_RESERVED:
    case TOK_LIMIT:
      abort();
      break;
    default:
      abort();
      break;
    }
    mark_token_chars(class, t.pos.begin.lineno, t.pos.begin.index, t.pos.end.lineno, t.pos.end.index);
    if (tt == TOK_STRING) {
      for (uint16_t i = t.pos.begin.index + 1; i < t.pos.end.index - 1; i++) {
        jschar c = lines[t.pos.begin.lineno - 1][i];
        if (c == '\\') {
          mark_token_chars(CLASS_SPECIALCHAR, t.pos.begin.lineno, i, t.pos.begin.lineno, i + 2);
          i++;
        }
      }
    }

    line_num = t.pos.end.lineno;
    column_num = t.pos.end.index;
  }

  /* output the highlighted code */
  enum Class class = CLASS_NONE;
  for (uint16_t i = 0; i < num_lines; i++) {
    uint16_t length = num_characters_in_line(lines[i]);
    for (uint16_t j = 0; j < length; j++) {
      jschar c = lines[i][j];
      if (classes[i][j] != class) {
        if (class != CLASS_NONE) {
          Stream_write_string(output, "</span>");
        }
        class = classes[i][j];
        if (class != CLASS_NONE) {
          Stream_printf(output, "<span class=\"%s\">", get_class_name(class));
        }
      }
      if (c == '&') {
        Stream_write_string(output, "&amp;");
      }
      else if (c == '<') {
        Stream_write_string(output, "&lt;");
      }
      else if (c == '>') {
        Stream_write_string(output, "&gt;");
      }
      else if (c == '\t' || (32 <= c && c <= 126)) {
        Stream_write_char(output, c);
      }
      else {
        Stream_printf(output, "&#%d;", c);
      }
    }
    if (class != CLASS_NONE) {
      Stream_write_string(output, "</span>");
      class = CLASS_NONE;
    }
    Stream_write_char(output, '\n');
  }

  for (uint16_t i = 0; i < num_lines; i++) {
    free(lines[i]);
    free(classes[i]);
  }
  free(lines);
  free(classes);

  /* cleanup */
  JS_UNKEEP_ATOMS(cx->runtime);
  context->fp = fp;
}
