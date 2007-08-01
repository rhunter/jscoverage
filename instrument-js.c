/*
    instrument-js.c - JavaScript instrumentation routines
    Copyright (C) 2007 siliconforks.com

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

#include "instrument-js.h"

#include <assert.h>
#include <stdlib.h>
#include <string.h>

#include <jsapi.h>
#include <jsatom.h>
#include <jsfun.h>
#include <jsinterp.h>
#include <jsparse.h>
#include <jsregexp.h>
#include <jsscope.h>
#include <jsstr.h>

#include "util.h"

static JSRuntime * runtime = NULL;
static JSContext * context = NULL;
static JSObject * global = NULL;

/*
JSParseNode objects store line numbers starting from 1.
The lines array stores line numbers starting from 0.
*/
static const char * file_id = NULL;
static char * lines = NULL;

void jscoverage_init(void) {
  runtime = JS_NewRuntime(8L * 1024L * 1024L);
  if (runtime == NULL) {
    fatal("cannot create runtime");
  }

  context = JS_NewContext(runtime, 8192);
  if (context == NULL) {
    fatal("cannot create context");
  }

  global = JS_NewObject(context, NULL, NULL, NULL);
  if (global == NULL) {
    fatal("cannot create global object");
  }

  if (! JS_InitStandardClasses(context, global)) {
    fatal("cannot initialize standard classes");
  }
}

void jscoverage_cleanup(void) {
  JS_DestroyContext(context);
  JS_DestroyRuntime(runtime);
}

static void print_string(JSString * s, FILE * f) {
  for (int i = 0; i < s->length; i++) {
    char c = s->chars[i];
    fputc(c, f);
  }
}

static void print_string_atom(JSAtom * atom, FILE * f) {
  assert(ATOM_IS_STRING(atom));
  JSString * s = ATOM_TO_STRING(atom);
  print_string(s, f);
}

static void print_string_jsval(jsval value, FILE * f) {
  assert(JSVAL_IS_STRING(value));
  JSString * s = JSVAL_TO_STRING(value);
  print_string(s, f);
}

static void print_quoted_string_atom(JSAtom * atom, FILE * f) {
  assert(ATOM_IS_STRING(atom));
  JSString * s = ATOM_TO_STRING(atom);
  JSString * quoted = js_QuoteString(context, s, '"');
  print_string(quoted, f);
}

static const char * get_op(uint8 op) {
  switch(op) {
  case JSOP_BITOR:
    return "|";
  case JSOP_BITXOR:
    return "^";
  case JSOP_BITAND:
    return "&";
  case JSOP_EQ:
    return "==";
  case JSOP_NE:
    return "!=";
  case JSOP_NEW_EQ:
    return "===";
  case JSOP_NEW_NE:
    return "!==";
  case JSOP_LT:
    return "<";
  case JSOP_LE:
    return "<=";
  case JSOP_GT:
    return ">";
  case JSOP_GE:
    return ">=";
  case JSOP_LSH:
    return "<<";
  case JSOP_RSH:
    return ">>";
  case JSOP_URSH:
    return ">>>";
  case JSOP_ADD:
    return "+";
  case JSOP_SUB:
    return "-";
  case JSOP_MUL:
    return "*";
  case JSOP_DIV:
    return "/";
  case JSOP_MOD:
    return "%";
  default:
    abort();
  }
}

static void instrument_expression(JSParseNode * node, FILE * f);
static void instrument_statement(JSParseNode * node, FILE * f, int indent);

static void instrument_function(JSParseNode * node, FILE * f, int indent) {
    assert(node->pn_arity == PN_FUNC);
    assert(ATOM_IS_OBJECT(node->pn_funAtom));
    JSObject * object = ATOM_TO_OBJECT(node->pn_funAtom);
    assert(JS_ObjectIsFunction(context, object));
    JSFunction * function = (JSFunction *) JS_GetPrivate(context, object);
    assert(function);
    assert(object == function->object);
    fprintf(f, "%*s", indent, "");
    fprintf(f, "function");

    /* function name */
    if (function->atom) {
      fputc(' ', f);
      print_string_atom(function->atom, f);
    }

    /* function parameters */
    fprintf(f, "(");
    JSAtom ** params = xmalloc(function->nargs * sizeof(JSAtom *));
    for (int i = 0; i < function->nargs; i++) {
      /* initialize to NULL for sanity check */
      params[i] = NULL;
    }
    JSScope * scope = OBJ_SCOPE(object);
    for (JSScopeProperty * scope_property = SCOPE_LAST_PROP(scope); scope_property != NULL; scope_property = scope_property->parent) {
      if (scope_property->getter != js_GetArgument) {
        continue;
      }
      assert(scope_property->flags & SPROP_HAS_SHORTID);
      assert((uint16) scope_property->shortid < function->nargs);
      assert(JSID_IS_ATOM(scope_property->id));
      params[(uint16) scope_property->shortid] = JSID_TO_ATOM(scope_property->id);
    }
    for (int i = 0; i < function->nargs; i++) {
      assert(params[i] != NULL);
      if (i > 0) {
        fprintf(f, ", ");
      }
      if (ATOM_IS_STRING(params[i])) {
        print_string_atom(params[i], f);
      }
    }
    fprintf(f, ") {\n");
    free(params);

    /* function body */
    instrument_statement(node->pn_body, f, indent + 2);

    fprintf(f, "}\n");
}

static void instrument_function_call(JSParseNode * node, FILE * f) {
  instrument_expression(node->pn_head, f);
  fputc('(', f);
  for (struct JSParseNode * p = node->pn_head->pn_next; p != NULL; p = p->pn_next) {
    if (p != node->pn_head->pn_next) {
      fprintf(f, ", ");
    }
    instrument_expression(p, f);
  }
  fputc(')', f);
}

/*
See <Expressions> in jsparse.h.
TOK_FUNCTION is handled as a statement and as an expression.
TOK_DBLDOT is not handled (XML op).
TOK_DEFSHARP and TOK_USESHARP are not handled.
TOK_ANYNAME is not handled (XML op).
TOK_AT is not handled (XML op).
TOK_DBLCOLON is not handled.
TOK_XML* are not handled.
There seem to be some undocumented expressions:
TOK_INSTANCEOF  binary
TOK_IN          binary
*/
static void instrument_expression(JSParseNode * node, FILE * f) {
  switch (node->pn_type) {
  case TOK_FUNCTION:
    instrument_function(node, f, 0);
    break;
  case TOK_COMMA:
    for (struct JSParseNode * p = node->pn_head; p != NULL; p = p->pn_next) {
      if (p != node->pn_head) {
        fprintf(f, ", ");
      }
      instrument_expression(p, f);
    }
    break;
  case TOK_ASSIGN:
    instrument_expression(node->pn_left, f);
    fputc(' ', f);
    switch (node->pn_op) {
    case JSOP_ADD:
    case JSOP_SUB:
    case JSOP_MUL:
    case JSOP_MOD:
    case JSOP_LSH:
    case JSOP_RSH:
    case JSOP_URSH:
    case JSOP_BITAND:
    case JSOP_BITOR:
    case JSOP_BITXOR:
    case JSOP_DIV:
      fprintf(f, "%s", get_op(node->pn_op));
      break;
    default:
      /* do nothing - it must be a simple assignment */
      break;
    }
    fprintf(f, "= ");
    instrument_expression(node->pn_right, f);
    break;
  case TOK_HOOK:
    instrument_expression(node->pn_kid1, f);
    fprintf(f, "? ");
    instrument_expression(node->pn_kid2, f);
    fprintf(f, ": ");
    instrument_expression(node->pn_kid3, f);
    break;
  case TOK_OR:
    instrument_expression(node->pn_left, f);
    fprintf(f, " || ");
    instrument_expression(node->pn_right, f);
    break;
  case TOK_AND:
    instrument_expression(node->pn_left, f);
    fprintf(f, " && ");
    instrument_expression(node->pn_right, f);
    break;
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
    switch (node->pn_arity) {
    case PN_BINARY:
      instrument_expression(node->pn_left, f);
      fprintf(f, " %s ", get_op(node->pn_op));
      instrument_expression(node->pn_right, f);
      break;
    case PN_LIST:
      for (struct JSParseNode * p = node->pn_head; p != NULL; p = p->pn_next) {
        if (p != node->pn_head) {
          fprintf(f, " %s ", get_op(node->pn_op));
        }
        instrument_expression(p, f);
      }
      break;
    default:
      abort();
    }
    break;
  case TOK_UNARYOP:
    switch (node->pn_op) {
    case JSOP_NEG:
      fputc('-', f);
      instrument_expression(node->pn_kid, f);
      break;
    case JSOP_POS:
      fputc('+', f);
      instrument_expression(node->pn_kid, f);
      break;
    case JSOP_NOT:
      fputc('!', f);
      instrument_expression(node->pn_kid, f);
      break;
    case JSOP_BITNOT:
      fputc('~', f);
      instrument_expression(node->pn_kid, f);
      break;
    case JSOP_TYPEOF:
      fprintf(f, "typeof ");
      instrument_expression(node->pn_kid, f);
      break;
    case JSOP_VOID:
      fprintf(f, "void ");
      instrument_expression(node->pn_kid, f);
      break;
    default:
      abort();
      break;
    }
    break;
  case TOK_INC:
  case TOK_DEC:
    /*
    This is not documented, but node->pn_op tells whether it is pre- or post-increment.
    */
    switch (node->pn_op) {
    case JSOP_INCNAME:
    case JSOP_INCPROP:
    case JSOP_INCELEM:
      fprintf(f, "++");
      instrument_expression(node->pn_kid, f);
      break;
    case JSOP_DECNAME:
    case JSOP_DECPROP:
    case JSOP_DECELEM:
      fprintf(f, "--");
      instrument_expression(node->pn_kid, f);
      break;
    case JSOP_NAMEINC:
    case JSOP_PROPINC:
    case JSOP_ELEMINC:
      instrument_expression(node->pn_kid, f);
      fprintf(f, "++");
      break;
    case JSOP_NAMEDEC:
    case JSOP_PROPDEC:
    case JSOP_ELEMDEC:
      instrument_expression(node->pn_kid, f);
      fprintf(f, "--");
      break;
    default:
      abort();
      break;
    }
    break;
  case TOK_NEW:
    fprintf(f, "new ");
    instrument_function_call(node, f);
    break;
  case TOK_DELETE:
    fprintf(f, "delete ");
    instrument_expression(node->pn_kid, f);
    break;
  case TOK_DOT:
    /*
    This may have originally been x['foo-bar'].  Because the string 'foo-bar'
    contains illegal characters, we have to use the subscript syntax instead of
    the dot syntax.
    */
    instrument_expression(node->pn_expr, f);
    /*
    fputc('.', f);
    print_string_atom(node->pn_atom, f);
    */
    fputc('[', f);
    print_quoted_string_atom(node->pn_atom, f);
    fputc(']', f);
    break;
  case TOK_LB:
    instrument_expression(node->pn_left, f);
    fputc('[', f);
    instrument_expression(node->pn_right, f);
    fputc(']', f);
    break;
  case TOK_LP:
    instrument_function_call(node, f);
    break;
  case TOK_RB:
    fputc('[', f);
    for (struct JSParseNode * p = node->pn_head; p != NULL; p = p->pn_next) {
      if (p != node->pn_head) {
        fprintf(f, ", ");
      }
      /* TOK_COMMA is a special case: a hole in the array */
      if (p->pn_type != TOK_COMMA) {
        instrument_expression(p, f);
      }
    }
    if (node->pn_extra == PNX_ENDCOMMA) {
      fputc(',', f);
    }
    fputc(']', f);
    break;
  case TOK_RC:
    fputc('{', f);
    for (struct JSParseNode * p = node->pn_head; p != NULL; p = p->pn_next) {
      assert(p->pn_type == TOK_COLON);
      if (p != node->pn_head) {
        fprintf(f, ", ");
      }
      instrument_expression(p->pn_left, f);
      fprintf(f, ": ");
      instrument_expression(p->pn_right, f);
    }
    fputc('}', f);
    break;
  case TOK_RP:
    fputc('(', f);
    instrument_expression(node->pn_kid, f);
    fputc(')', f);
    break;
  case TOK_NAME:
    print_string_atom(node->pn_atom, f);
    break;
  case TOK_STRING:
    print_quoted_string_atom(node->pn_atom, f);
    break;
  case TOK_OBJECT:
    switch (node->pn_op) {
    case JSOP_OBJECT:
      /* I assume this is JSOP_REGEXP */
      abort();
      break;
    case JSOP_REGEXP:
      assert(ATOM_IS_OBJECT(node->pn_atom));
      {
        JSObject * object = ATOM_TO_OBJECT(node->pn_atom);
        jsval result;
        js_regexp_toString(context, object, 0, NULL, &result);
        print_string_jsval(result, f);
      }
      break;
    default:
      abort();
      break;
    }
    break;
  case TOK_NUMBER:
    /*
    A 64-bit IEEE 754 floating point number has a 52-bit fraction.
    2^(-52) = 2.22 x 10^(-16)
    Thus there are 16 significant digits.
    To keep the output simple, special-case zero.
    */
    if (node->pn_dval == 0.0) {
      fprintf(f, "0");
    }
    else {
      fprintf(f, "%.15g", node->pn_dval);
    }
    break;
  case TOK_PRIMARY:
    switch (node->pn_op) {
    case JSOP_TRUE:
      fprintf(f, "true");
      break;
    case JSOP_FALSE:
      fprintf(f, "false");
      break;
    case JSOP_NULL:
      fprintf(f, "null");
      break;
    case JSOP_THIS:
      fprintf(f, "this");
      break;
    /* jsscan.h mentions `super' ??? */
    default:
      abort();
    }
    break;
  case TOK_INSTANCEOF:
    instrument_expression(node->pn_left, f);
    fprintf(f, " instanceof ");
    instrument_expression(node->pn_right, f);
    break;
  case TOK_IN:
    instrument_expression(node->pn_left, f);
    fprintf(f, " in ");
    instrument_expression(node->pn_right, f);
    break;
  default:
    fatal("unsupported node type in file %s: %d", file_id, node->pn_type);
  }
}

static void instrument_var_statement(JSParseNode * node, FILE * f, int indent) {
  assert(node->pn_arity == PN_LIST);
  fprintf(f, "%*s", indent, "");
  fprintf(f, "var ");
  for (struct JSParseNode * p = node->pn_u.list.head; p != NULL; p = p->pn_next) {
    assert(p->pn_type == TOK_NAME);
    assert(p->pn_arity == PN_NAME);
    if (p != node->pn_head) {
      fprintf(f, ", ");
    }
    print_string_atom(p->pn_atom, f);
    if (p->pn_expr != NULL) {
      fprintf(f, " = ");
      instrument_expression(p->pn_expr, f);
    }
  }
}

static void output_statement(JSParseNode * node, FILE * f, int indent) {
  switch (node->pn_type) {
  case TOK_FUNCTION:
    instrument_function(node, f, indent);
    break;
  case TOK_LC:
    assert(node->pn_arity == PN_LIST);
/*
    fprintf(f, "{\n");
*/
    for (struct JSParseNode * p = node->pn_u.list.head; p != NULL; p = p->pn_next) {
      instrument_statement(p, f, indent);
    }
/*
    fprintf(f, "%*s", indent, "");
    fprintf(f, "}\n");
*/
    break;
  case TOK_IF:
    assert(node->pn_arity == PN_TERNARY);
    fprintf(f, "%*s", indent, "");
    fprintf(f, "if (");
    instrument_expression(node->pn_kid1, f);
    fprintf(f, ") {\n");
    instrument_statement(node->pn_kid2, f, indent + 2);
    fprintf(f, "%*s", indent, "");
    fprintf(f, "}\n");
    if (node->pn_kid3) {
      fprintf(f, "%*s", indent, "");
      fprintf(f, "else {\n");
      instrument_statement(node->pn_kid3, f, indent + 2);
      fprintf(f, "%*s", indent, "");
      fprintf(f, "}\n");
    }
    break;
  case TOK_SWITCH:
    assert(node->pn_arity == PN_BINARY);
    fprintf(f, "%*s", indent, "");
    fprintf(f, "switch (");
    instrument_expression(node->pn_left, f);
    fprintf(f, ") {\n");
    for (struct JSParseNode * p = node->pn_right->pn_head; p != NULL; p = p->pn_next) {
      fprintf(f, "%*s", indent, "");
      switch (p->pn_type) {
      case TOK_CASE:
        fprintf(f, "case ");
        instrument_expression(p->pn_left, f);
        fprintf(f, ":\n");
        break;
      case TOK_DEFAULT:
        fprintf(f, "default:\n");
        break;
      default:
        abort();
        break;
      }
      instrument_statement(p->pn_right, f, indent + 2);
    }
    fprintf(f, "%*s", indent, "");
    fprintf(f, "}\n");
    break;
  case TOK_CASE:
  case TOK_DEFAULT:
    abort();
    break;
  case TOK_WHILE:
    assert(node->pn_arity == PN_BINARY);
    fprintf(f, "%*s", indent, "");
    fprintf(f, "while (");
    instrument_expression(node->pn_left, f);
    fprintf(f, ") {\n");
    instrument_statement(node->pn_right, f, indent + 2);
    fprintf(f, "}\n");
    break;
  case TOK_DO:
    assert(node->pn_arity == PN_BINARY);
    fprintf(f, "%*s", indent, "");
    fprintf(f, "do {\n");
    instrument_statement(node->pn_left, f, indent + 2);
    fprintf(f, "}\n");
    fprintf(f, "%*s", indent, "");
    fprintf(f, "while (");
    instrument_expression(node->pn_right, f);
    fprintf(f, ");\n");
    break;
  case TOK_FOR:
    assert(node->pn_arity == PN_BINARY);
    fprintf(f, "%*s", indent, "");
    fprintf(f, "for (");
    switch (node->pn_left->pn_type) {
    case TOK_IN:
      /* for/in */
      assert(node->pn_left->pn_arity == PN_BINARY);
      switch (node->pn_left->pn_left->pn_type) {
      case TOK_VAR:
        instrument_var_statement(node->pn_left->pn_left, f, 0);
        break;
      case TOK_NAME:
        instrument_expression(node->pn_left->pn_left, f);
        break;
      default:
        /* this is undocumented: for (x.value in y) */
        instrument_expression(node->pn_left->pn_left, f);
        break;
/*
      default:
        fprintf(stderr, "unexpected node type: %d\n", node->pn_left->pn_left->pn_type);
        abort();
        break;
*/
      }
      fprintf(f, " in ");
      instrument_expression(node->pn_left->pn_right, f);
      break;
    case TOK_RESERVED:
      /* for (;;) */
      assert(node->pn_left->pn_arity == PN_TERNARY);
      if (node->pn_left->pn_kid1) {
        if (node->pn_left->pn_kid1->pn_type == TOK_VAR) {
          instrument_var_statement(node->pn_left->pn_kid1, f, 0);
        }
        else {
          instrument_expression(node->pn_left->pn_kid1, f);
        }
      }
      fprintf(f, ";");
      if (node->pn_left->pn_kid2) {
        fputc(' ', f);
        instrument_expression(node->pn_left->pn_kid2, f);
      }
      fprintf(f, ";");
      if (node->pn_left->pn_kid3) {
        fputc(' ', f);
        instrument_expression(node->pn_left->pn_kid3, f);
      }
      break;
    default:
      abort();
      break;
    }
    fprintf(f, ") {\n");
    instrument_statement(node->pn_right, f, indent + 2);
    fprintf(f, "}\n");
    break;
  case TOK_THROW:
    assert(node->pn_arity == PN_UNARY);
    fprintf(f, "%*s", indent, "");
    fprintf(f, "throw ");
    instrument_expression(node->pn_u.unary.kid, f);
    fprintf(f, ";\n");
    break;
  case TOK_TRY:
    fprintf(f, "%*s", indent, "");
    fprintf(f, "try {\n");
    instrument_statement(node->pn_kid1, f, indent + 2);
    fprintf(f, "%*s", indent, "");
    fprintf(f, "}\n");
    {
      for (JSParseNode * catch = node->pn_kid2; catch != NULL; catch = catch->pn_kid2) {
        assert(catch->pn_type == TOK_CATCH);
        fprintf(f, "%*s", indent, "");
        fprintf(f, "catch (");
        assert(catch->pn_kid1->pn_arity == PN_NAME);
        print_string_atom(catch->pn_kid1->pn_atom, f);
        if (catch->pn_kid1->pn_expr) {
          fprintf(f, " if ");
          instrument_expression(catch->pn_kid1->pn_expr, f);
        }
        fprintf(f, ") {\n");
        instrument_statement(catch->pn_kid3, f, indent + 2);
        fprintf(f, "%*s", indent, "");
        fprintf(f, "}\n");
      }
    }
    if (node->pn_kid3) {
      fprintf(f, "%*s", indent, "");
      fprintf(f, "finally {\n");
      instrument_statement(node->pn_kid3, f, indent + 2);
      fprintf(f, "%*s", indent, "");
      fprintf(f, "}\n");
    }
    break;
  case TOK_CATCH:
    abort();
    break;
  case TOK_BREAK:
  case TOK_CONTINUE:
    assert(node->pn_arity == PN_NAME || node->pn_arity == PN_NULLARY);
    fprintf(f, "%*s", indent, "");
    fputs(node->pn_type == TOK_BREAK? "break": "continue", f);
    JSAtom * atom = node->pn_u.name.atom;
    if (atom != NULL) {
      fputc(' ', f);
      print_string_atom(node->pn_atom, f);
    }
    fprintf(f, ";\n");
    break;
  case TOK_WITH:
    assert(node->pn_arity == PN_BINARY);
    fprintf(f, "%*s", indent, "");
    fprintf(f, "with (");
    instrument_expression(node->pn_left, f);
    fprintf(f, ") {\n");
    instrument_statement(node->pn_right, f, indent + 2);
    fprintf(f, "%*s", indent, "");
    fprintf(f, "}\n");
    break;
  case TOK_VAR:
    instrument_var_statement(node, f, indent);
    fprintf(f, ";\n");
    break;
  case TOK_RETURN:
    assert(node->pn_arity == PN_UNARY);
    fprintf(f, "%*s", indent, "");
    fprintf(f, "return");
    if (node->pn_kid != NULL) {
      fprintf(f, " ");
      instrument_expression(node->pn_kid, f);
    }
    fprintf(f, ";\n");
    break;
  case TOK_SEMI:
    assert(node->pn_arity == PN_UNARY);
    fprintf(f, "%*s", indent, "");
    if (node->pn_kid != NULL) {
      instrument_expression(node->pn_kid, f);
    }
    fprintf(f, ";\n");
    break;
  case TOK_COLON:
    assert(node->pn_arity == PN_NAME);
    /*
    This one is tricky: can't output instrumentation between the label and the
    statement it's supposed to label ...
    */
    fprintf(f, "%*s", indent < 2? 0: indent - 2, "");
    print_string_atom(node->pn_atom, f);
    fprintf(f, ":\n");
    /*
    ... use output_statement instead of instrument_statement.
    */
    output_statement(node->pn_expr, f, indent);
    break;
  default:
    fatal("unsupported node type in file %s: %d", file_id, node->pn_type);
  }
}

/*
See <Statements> in jsparse.h.
TOK_FUNCTION is handled as a statement and as an expression.
TOK_EXPORT, TOK_IMPORT are not handled.
*/
static void instrument_statement(JSParseNode * node, FILE * f, int indent) {
  if (node->pn_type != TOK_LC) {
    int line = node->pn_pos.begin.lineno;
    /* the root node has line number 0 */
    if (line != 0) {
      fprintf(f, "%*s", indent, "");
      fprintf(f, "_$jscoverage['%s'][%d]++;\n", file_id, line);
      lines[line - 1] = 1;
    }
  }
  output_statement(node, f, indent);
}

static void instrument_js_stream(const char * id, int line, FILE * input, FILE * output) {
  file_id = id;

  /* scan the javascript */
  JSTokenStream * token_stream = js_NewFileTokenStream(context, NULL, input);
  if (token_stream == NULL) {
    fatal("cannot create token stream from file: %s", file_id);
  }

  /* parse the javascript */
  JSParseNode * node = js_ParseTokenStream(context, global, token_stream);
  if (node == NULL) {
    fatal("parse error in file: %s", file_id);
  }
  int num_lines = node->pn_pos.end.lineno;
  lines = xmalloc(num_lines);
  for (int i = 0; i < num_lines; i++) {
    lines[i] = 0;
  }

  /*
  Create a temporary file - we can't write directly to the output because we
  need to know the line number info first.
  */
  FILE * temporary = tmpfile();
  if (temporary == NULL) {
    fatal("cannot create temporary file for script: %s", file_id);
  }

  /* write instrumented javascript to the temporary */
  instrument_statement(node, temporary, 0);

  /* write line number info to the output */
  fprintf(output, "/* automatically generated by JSCoverage - do not edit */\n");
  fprintf(output, "if (! top._$jscoverage) {\n  top._$jscoverage = {};\n}\n");
  fprintf(output, "var _$jscoverage = top._$jscoverage;\n");
  fprintf(output, "if (! _$jscoverage['%s']) {\n", file_id);
  fprintf(output, "  _$jscoverage['%s'] = [];\n", file_id);
  for (int i = 0; i < num_lines; i++) {
    if (lines[i]) {
      fprintf(output, "  _$jscoverage['%s'][%d] = 0;\n", file_id, i + 1);
    }
  }
  fprintf(output, "}\n");
  lines = NULL;

  /* copy the temporary to the output */
  fseek(temporary, 0, SEEK_SET);
  copy_stream(temporary, output);

  fclose(temporary);

  file_id = NULL;
}

void jscoverage_instrument_js(const char * id, FILE * input, FILE * output) {
  instrument_js_stream(id, 0, input, output);
}
