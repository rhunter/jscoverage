/*
    instrument-js.c - JavaScript instrumentation routines
    Copyright (C) 2007, 2008 siliconforks.com

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

#include "resource-manager.h"
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

static void print_string(JSString * s, Stream * f) {
  for (size_t i = 0; i < s->length; i++) {
    char c = s->chars[i];
    Stream_write_char(f, c);
  }
}

static void print_string_atom(JSAtom * atom, Stream * f) {
  assert(ATOM_IS_STRING(atom));
  JSString * s = ATOM_TO_STRING(atom);
  print_string(s, f);
}

static void print_string_jsval(jsval value, Stream * f) {
  assert(JSVAL_IS_STRING(value));
  JSString * s = JSVAL_TO_STRING(value);
  print_string(s, f);
}

static void print_quoted_string_atom(JSAtom * atom, Stream * f) {
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

static void instrument_expression(JSParseNode * node, Stream * f);
static void instrument_statement(JSParseNode * node, Stream * f, int indent);

enum FunctionType {
  FUNCTION_NORMAL,
  FUNCTION_GETTER_OR_SETTER
};

static void instrument_function(JSParseNode * node, Stream * f, int indent, enum FunctionType type) {
  assert(node->pn_arity == PN_FUNC);
  assert(ATOM_IS_OBJECT(node->pn_funAtom));
  JSObject * object = ATOM_TO_OBJECT(node->pn_funAtom);
  assert(JS_ObjectIsFunction(context, object));
  JSFunction * function = (JSFunction *) JS_GetPrivate(context, object);
  assert(function);
  assert(object == function->object);
  Stream_printf(f, "%*s", indent, "");
  if (type == FUNCTION_NORMAL) {
    Stream_write_string(f, "function");
  }

  /* function name */
  if (function->atom) {
    Stream_write_char(f, ' ');
    print_string_atom(function->atom, f);
  }

  /* function parameters */
  Stream_write_string(f, "(");
  JSAtom ** params = xnew(JSAtom *, function->nargs);
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
      Stream_write_string(f, ", ");
    }
    if (ATOM_IS_STRING(params[i])) {
      print_string_atom(params[i], f);
    }
  }
  Stream_write_string(f, ") {\n");
  free(params);

  /* function body */
  instrument_statement(node->pn_body, f, indent + 2);

  Stream_write_string(f, "}\n");
}

static void instrument_function_call(JSParseNode * node, Stream * f) {
  instrument_expression(node->pn_head, f);
  Stream_write_char(f, '(');
  for (struct JSParseNode * p = node->pn_head->pn_next; p != NULL; p = p->pn_next) {
    if (p != node->pn_head->pn_next) {
      Stream_write_string(f, ", ");
    }
    instrument_expression(p, f);
  }
  Stream_write_char(f, ')');
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
static void instrument_expression(JSParseNode * node, Stream * f) {
  switch (node->pn_type) {
  case TOK_FUNCTION:
    instrument_function(node, f, 0, FUNCTION_NORMAL);
    break;
  case TOK_COMMA:
    for (struct JSParseNode * p = node->pn_head; p != NULL; p = p->pn_next) {
      if (p != node->pn_head) {
        Stream_write_string(f, ", ");
      }
      instrument_expression(p, f);
    }
    break;
  case TOK_ASSIGN:
    instrument_expression(node->pn_left, f);
    Stream_write_char(f, ' ');
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
      Stream_printf(f, "%s", get_op(node->pn_op));
      break;
    default:
      /* do nothing - it must be a simple assignment */
      break;
    }
    Stream_write_string(f, "= ");
    instrument_expression(node->pn_right, f);
    break;
  case TOK_HOOK:
    instrument_expression(node->pn_kid1, f);
    Stream_write_string(f, "? ");
    instrument_expression(node->pn_kid2, f);
    Stream_write_string(f, ": ");
    instrument_expression(node->pn_kid3, f);
    break;
  case TOK_OR:
    instrument_expression(node->pn_left, f);
    Stream_write_string(f, " || ");
    instrument_expression(node->pn_right, f);
    break;
  case TOK_AND:
    instrument_expression(node->pn_left, f);
    Stream_write_string(f, " && ");
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
      Stream_printf(f, " %s ", get_op(node->pn_op));
      instrument_expression(node->pn_right, f);
      break;
    case PN_LIST:
      for (struct JSParseNode * p = node->pn_head; p != NULL; p = p->pn_next) {
        if (p != node->pn_head) {
          Stream_printf(f, " %s ", get_op(node->pn_op));
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
      Stream_write_char(f, '-');
      instrument_expression(node->pn_kid, f);
      break;
    case JSOP_POS:
      Stream_write_char(f, '+');
      instrument_expression(node->pn_kid, f);
      break;
    case JSOP_NOT:
      Stream_write_char(f, '!');
      instrument_expression(node->pn_kid, f);
      break;
    case JSOP_BITNOT:
      Stream_write_char(f, '~');
      instrument_expression(node->pn_kid, f);
      break;
    case JSOP_TYPEOF:
      Stream_write_string(f, "typeof ");
      instrument_expression(node->pn_kid, f);
      break;
    case JSOP_VOID:
      Stream_write_string(f, "void ");
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
      Stream_write_string(f, "++");
      instrument_expression(node->pn_kid, f);
      break;
    case JSOP_DECNAME:
    case JSOP_DECPROP:
    case JSOP_DECELEM:
      Stream_write_string(f, "--");
      instrument_expression(node->pn_kid, f);
      break;
    case JSOP_NAMEINC:
    case JSOP_PROPINC:
    case JSOP_ELEMINC:
      instrument_expression(node->pn_kid, f);
      Stream_write_string(f, "++");
      break;
    case JSOP_NAMEDEC:
    case JSOP_PROPDEC:
    case JSOP_ELEMDEC:
      instrument_expression(node->pn_kid, f);
      Stream_write_string(f, "--");
      break;
    default:
      abort();
      break;
    }
    break;
  case TOK_NEW:
    Stream_write_string(f, "new ");
    instrument_function_call(node, f);
    break;
  case TOK_DELETE:
    Stream_write_string(f, "delete ");
    instrument_expression(node->pn_kid, f);
    break;
  case TOK_DOT:
    /*
    This may have originally been x['foo-bar'].  Because the string 'foo-bar'
    contains illegal characters, we have to use the subscript syntax instead of
    the dot syntax.
    */
    instrument_expression(node->pn_expr, f);
    assert(ATOM_IS_STRING(node->pn_atom));
    {
      JSString * s = ATOM_TO_STRING(node->pn_atom);
      /* XXX - semantics changed in 1.7 */
      if (! ATOM_KEYWORD(node->pn_atom) && js_IsIdentifier(s)) {
        Stream_write_char(f, '.');
        print_string_atom(node->pn_atom, f);
      }
      else {
        Stream_write_char(f, '[');
        print_quoted_string_atom(node->pn_atom, f);
        Stream_write_char(f, ']');
      }
    }
    break;
  case TOK_LB:
    instrument_expression(node->pn_left, f);
    Stream_write_char(f, '[');
    instrument_expression(node->pn_right, f);
    Stream_write_char(f, ']');
    break;
  case TOK_LP:
    instrument_function_call(node, f);
    break;
  case TOK_RB:
    Stream_write_char(f, '[');
    for (struct JSParseNode * p = node->pn_head; p != NULL; p = p->pn_next) {
      if (p != node->pn_head) {
        Stream_write_string(f, ", ");
      }
      /* TOK_COMMA is a special case: a hole in the array */
      if (p->pn_type != TOK_COMMA) {
        instrument_expression(p, f);
      }
    }
    if (node->pn_extra == PNX_ENDCOMMA) {
      Stream_write_char(f, ',');
    }
    Stream_write_char(f, ']');
    break;
  case TOK_RC:
    Stream_write_char(f, '{');
    for (struct JSParseNode * p = node->pn_head; p != NULL; p = p->pn_next) {
      assert(p->pn_type == TOK_COLON);
      if (p != node->pn_head) {
        Stream_write_string(f, ", ");
      }

      /* check whether this is a getter or setter */
      switch (p->pn_op) {
      case JSOP_GETTER:
        Stream_write_string(f, "get ");
        instrument_expression(p->pn_left, f);
        instrument_function(p->pn_right, f, 0, FUNCTION_GETTER_OR_SETTER);
        break;
      case JSOP_SETTER:
        Stream_write_string(f, "set ");
        instrument_expression(p->pn_left, f);
        instrument_function(p->pn_right, f, 0, FUNCTION_GETTER_OR_SETTER);
        break;
      default:
        instrument_expression(p->pn_left, f);
        Stream_write_string(f, ": ");
        instrument_expression(p->pn_right, f);
        break;
      }
    }
    Stream_write_char(f, '}');
    break;
  case TOK_RP:
    Stream_write_char(f, '(');
    instrument_expression(node->pn_kid, f);
    Stream_write_char(f, ')');
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
      Stream_write_string(f, "0");
    }
    else {
      Stream_printf(f, "%.15g", node->pn_dval);
    }
    break;
  case TOK_PRIMARY:
    switch (node->pn_op) {
    case JSOP_TRUE:
      Stream_write_string(f, "true");
      break;
    case JSOP_FALSE:
      Stream_write_string(f, "false");
      break;
    case JSOP_NULL:
      Stream_write_string(f, "null");
      break;
    case JSOP_THIS:
      Stream_write_string(f, "this");
      break;
    /* jsscan.h mentions `super' ??? */
    default:
      abort();
    }
    break;
  case TOK_INSTANCEOF:
    instrument_expression(node->pn_left, f);
    Stream_write_string(f, " instanceof ");
    instrument_expression(node->pn_right, f);
    break;
  case TOK_IN:
    instrument_expression(node->pn_left, f);
    Stream_write_string(f, " in ");
    instrument_expression(node->pn_right, f);
    break;
  default:
    fatal("unsupported node type in file %s: %d", file_id, node->pn_type);
  }
}

static void instrument_var_statement(JSParseNode * node, Stream * f, int indent) {
  assert(node->pn_arity == PN_LIST);
  Stream_printf(f, "%*s", indent, "");
  Stream_write_string(f, "var ");
  for (struct JSParseNode * p = node->pn_u.list.head; p != NULL; p = p->pn_next) {
    assert(p->pn_type == TOK_NAME);
    assert(p->pn_arity == PN_NAME);
    if (p != node->pn_head) {
      Stream_write_string(f, ", ");
    }
    print_string_atom(p->pn_atom, f);
    if (p->pn_expr != NULL) {
      Stream_write_string(f, " = ");
      instrument_expression(p->pn_expr, f);
    }
  }
}

static void output_statement(JSParseNode * node, Stream * f, int indent) {
  switch (node->pn_type) {
  case TOK_FUNCTION:
    instrument_function(node, f, indent, FUNCTION_NORMAL);
    break;
  case TOK_LC:
    assert(node->pn_arity == PN_LIST);
/*
    Stream_write_string(f, "{\n");
*/
    for (struct JSParseNode * p = node->pn_u.list.head; p != NULL; p = p->pn_next) {
      instrument_statement(p, f, indent);
    }
/*
    Stream_printf(f, "%*s", indent, "");
    Stream_write_string(f, "}\n");
*/
    break;
  case TOK_IF:
    assert(node->pn_arity == PN_TERNARY);
    Stream_printf(f, "%*s", indent, "");
    Stream_write_string(f, "if (");
    instrument_expression(node->pn_kid1, f);
    Stream_write_string(f, ") {\n");
    instrument_statement(node->pn_kid2, f, indent + 2);
    Stream_printf(f, "%*s", indent, "");
    Stream_write_string(f, "}\n");
    if (node->pn_kid3) {
      Stream_printf(f, "%*s", indent, "");
      Stream_write_string(f, "else {\n");
      instrument_statement(node->pn_kid3, f, indent + 2);
      Stream_printf(f, "%*s", indent, "");
      Stream_write_string(f, "}\n");
    }
    break;
  case TOK_SWITCH:
    assert(node->pn_arity == PN_BINARY);
    Stream_printf(f, "%*s", indent, "");
    Stream_write_string(f, "switch (");
    instrument_expression(node->pn_left, f);
    Stream_write_string(f, ") {\n");
    for (struct JSParseNode * p = node->pn_right->pn_head; p != NULL; p = p->pn_next) {
      Stream_printf(f, "%*s", indent, "");
      switch (p->pn_type) {
      case TOK_CASE:
        Stream_write_string(f, "case ");
        instrument_expression(p->pn_left, f);
        Stream_write_string(f, ":\n");
        break;
      case TOK_DEFAULT:
        Stream_write_string(f, "default:\n");
        break;
      default:
        abort();
        break;
      }
      instrument_statement(p->pn_right, f, indent + 2);
    }
    Stream_printf(f, "%*s", indent, "");
    Stream_write_string(f, "}\n");
    break;
  case TOK_CASE:
  case TOK_DEFAULT:
    abort();
    break;
  case TOK_WHILE:
    assert(node->pn_arity == PN_BINARY);
    Stream_printf(f, "%*s", indent, "");
    Stream_write_string(f, "while (");
    instrument_expression(node->pn_left, f);
    Stream_write_string(f, ") {\n");
    instrument_statement(node->pn_right, f, indent + 2);
    Stream_write_string(f, "}\n");
    break;
  case TOK_DO:
    assert(node->pn_arity == PN_BINARY);
    Stream_printf(f, "%*s", indent, "");
    Stream_write_string(f, "do {\n");
    instrument_statement(node->pn_left, f, indent + 2);
    Stream_write_string(f, "}\n");
    Stream_printf(f, "%*s", indent, "");
    Stream_write_string(f, "while (");
    instrument_expression(node->pn_right, f);
    Stream_write_string(f, ");\n");
    break;
  case TOK_FOR:
    assert(node->pn_arity == PN_BINARY);
    Stream_printf(f, "%*s", indent, "");
    Stream_write_string(f, "for (");
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
      Stream_write_string(f, " in ");
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
      Stream_write_string(f, ";");
      if (node->pn_left->pn_kid2) {
        Stream_write_char(f, ' ');
        instrument_expression(node->pn_left->pn_kid2, f);
      }
      Stream_write_string(f, ";");
      if (node->pn_left->pn_kid3) {
        Stream_write_char(f, ' ');
        instrument_expression(node->pn_left->pn_kid3, f);
      }
      break;
    default:
      abort();
      break;
    }
    Stream_write_string(f, ") {\n");
    instrument_statement(node->pn_right, f, indent + 2);
    Stream_write_string(f, "}\n");
    break;
  case TOK_THROW:
    assert(node->pn_arity == PN_UNARY);
    Stream_printf(f, "%*s", indent, "");
    Stream_write_string(f, "throw ");
    instrument_expression(node->pn_u.unary.kid, f);
    Stream_write_string(f, ";\n");
    break;
  case TOK_TRY:
    Stream_printf(f, "%*s", indent, "");
    Stream_write_string(f, "try {\n");
    instrument_statement(node->pn_kid1, f, indent + 2);
    Stream_printf(f, "%*s", indent, "");
    Stream_write_string(f, "}\n");
    {
      for (JSParseNode * catch = node->pn_kid2; catch != NULL; catch = catch->pn_kid2) {
        assert(catch->pn_type == TOK_CATCH);
        Stream_printf(f, "%*s", indent, "");
        Stream_write_string(f, "catch (");
        assert(catch->pn_kid1->pn_arity == PN_NAME);
        print_string_atom(catch->pn_kid1->pn_atom, f);
        if (catch->pn_kid1->pn_expr) {
          Stream_write_string(f, " if ");
          instrument_expression(catch->pn_kid1->pn_expr, f);
        }
        Stream_write_string(f, ") {\n");
        instrument_statement(catch->pn_kid3, f, indent + 2);
        Stream_printf(f, "%*s", indent, "");
        Stream_write_string(f, "}\n");
      }
    }
    if (node->pn_kid3) {
      Stream_printf(f, "%*s", indent, "");
      Stream_write_string(f, "finally {\n");
      instrument_statement(node->pn_kid3, f, indent + 2);
      Stream_printf(f, "%*s", indent, "");
      Stream_write_string(f, "}\n");
    }
    break;
  case TOK_CATCH:
    abort();
    break;
  case TOK_BREAK:
  case TOK_CONTINUE:
    assert(node->pn_arity == PN_NAME || node->pn_arity == PN_NULLARY);
    Stream_printf(f, "%*s", indent, "");
    Stream_write_string(f, node->pn_type == TOK_BREAK? "break": "continue");
    JSAtom * atom = node->pn_u.name.atom;
    if (atom != NULL) {
      Stream_write_char(f, ' ');
      print_string_atom(node->pn_atom, f);
    }
    Stream_write_string(f, ";\n");
    break;
  case TOK_WITH:
    assert(node->pn_arity == PN_BINARY);
    Stream_printf(f, "%*s", indent, "");
    Stream_write_string(f, "with (");
    instrument_expression(node->pn_left, f);
    Stream_write_string(f, ") {\n");
    instrument_statement(node->pn_right, f, indent + 2);
    Stream_printf(f, "%*s", indent, "");
    Stream_write_string(f, "}\n");
    break;
  case TOK_VAR:
    instrument_var_statement(node, f, indent);
    Stream_write_string(f, ";\n");
    break;
  case TOK_RETURN:
    assert(node->pn_arity == PN_UNARY);
    Stream_printf(f, "%*s", indent, "");
    Stream_write_string(f, "return");
    if (node->pn_kid != NULL) {
      Stream_write_char(f, ' ');
      instrument_expression(node->pn_kid, f);
    }
    Stream_write_string(f, ";\n");
    break;
  case TOK_SEMI:
    assert(node->pn_arity == PN_UNARY);
    Stream_printf(f, "%*s", indent, "");
    if (node->pn_kid != NULL) {
      instrument_expression(node->pn_kid, f);
    }
    Stream_write_string(f, ";\n");
    break;
  case TOK_COLON:
    assert(node->pn_arity == PN_NAME);
    /*
    This one is tricky: can't output instrumentation between the label and the
    statement it's supposed to label ...
    */
    Stream_printf(f, "%*s", indent < 2? 0: indent - 2, "");
    print_string_atom(node->pn_atom, f);
    Stream_write_string(f, ":\n");
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
static void instrument_statement(JSParseNode * node, Stream * f, int indent) {
  if (node->pn_type != TOK_LC) {
    int line = node->pn_pos.begin.lineno;
    /* the root node has line number 0 */
    if (line != 0) {
      Stream_printf(f, "%*s", indent, "");
      Stream_printf(f, "_$jscoverage['%s'][%d]++;\n", file_id, line);
      lines[line - 1] = 1;
    }
  }
  output_statement(node, f, indent);
}

void jscoverage_instrument_js(const char * id, Stream * input, Stream * output) {
  file_id = id;

  /* scan the javascript */
  size_t input_length = input->length;
  jschar * base = js_InflateString(context, (char *) input->data, &input_length);
  if (base == NULL) {
    fatal("out of memory");
  }
  JSTokenStream * token_stream = js_NewTokenStream(context, base, input_length, NULL, 1, NULL);
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
  An instrumented JavaScript file has 3 sections:
  1. initialization
  2. instrumented source code
  3. original source code
  */

  Stream * instrumented = Stream_new(0);
  instrument_statement(node, instrumented, 0);

  /* write line number info to the output */
  Stream_write_string(output, "/* automatically generated by JSCoverage - do not edit */\n");
  Stream_write_string(output, "if (! top._$jscoverage) {\n  top._$jscoverage = {};\n}\n");
  Stream_write_string(output, "var _$jscoverage = top._$jscoverage;\n");
  Stream_printf(output, "if (! _$jscoverage['%s']) {\n", file_id);
  Stream_printf(output, "  _$jscoverage['%s'] = [];\n", file_id);
  for (int i = 0; i < num_lines; i++) {
    if (lines[i]) {
      Stream_printf(output, "  _$jscoverage['%s'][%d] = 0;\n", file_id, i + 1);
    }
  }
  Stream_write_string(output, "}\n");
  free(lines);
  lines = NULL;

  /* copy the instrumented source code to the output */
  Stream_write(output, instrumented->data, instrumented->length);
  Stream_write_char(output, '\n');

  /* conditionals */
  bool has_conditionals = false;
  size_t line_number = 0;
  size_t i = 0;
  while (i < input_length) {
    line_number++;
    size_t line_start = i;
    while (i < input_length && base[i] != '\r' && base[i] != '\n') {
      i++;
    }
    size_t line_end = i;
    if (i < input_length) {
      if (base[i] == '\r') {
        line_end = i;
        i++;
        if (i < input_length && base[i] == '\n') {
          i++;
        }
      }
      else if (base[i] == '\n') {
        line_end = i;
        i++;
      }
      else {
        abort();
      }
    }
    char * line = js_DeflateString(context, base + line_start, line_end - line_start);
    if (str_starts_with(line, "//#JSCOVERAGE_IF")) {
      if (! has_conditionals) {
        has_conditionals = true;
        Stream_printf(output, "_$jscoverage['%s'].conditionals = [];\n", file_id);
      }
      Stream_printf(output, "if (!%s) {\n", line + 16);
      Stream_printf(output, "  _$jscoverage['%s'].conditionals[%d] = ", file_id, line_number);
    }
    else if (str_starts_with(line, "//#JSCOVERAGE_ENDIF")) {
      Stream_printf(output, "%d;\n", line_number);
      Stream_printf(output, "}\n");
    }
    JS_free(context, line);
  }

  /* copy the original source to the output */
  i = 0;
  while (i < input_length) {
    Stream_write_string(output, "// ");
    size_t line_start = i;
    while (i < input_length && base[i] != '\r' && base[i] != '\n') {
      i++;
    }

    size_t line_end = i;
    if (i < input_length) {
      if (base[i] == '\r') {
        line_end = i;
        i++;
        if (i < input_length && base[i] == '\n') {
          i++;
        }
      }
      else if (base[i] == '\n') {
        line_end = i;
        i++;
      }
      else {
        abort();
      }
    }

    char * line = js_DeflateString(context, base + line_start, line_end - line_start);
    Stream_write_string(output, line);
    Stream_write_char(output, '\n');
    JS_free(context, line);
  }

  Stream_delete(instrumented);

  JS_free(context, base);

  file_id = NULL;
}

void jscoverage_copy_resources(const char * destination_directory) {
  copy_resource("jscoverage.html", destination_directory);
  copy_resource("jscoverage.css", destination_directory);
  copy_resource("jscoverage.js", destination_directory);
  copy_resource("jscoverage-ie.js", destination_directory);
  copy_resource("jscoverage-throbber.gif", destination_directory);
  copy_resource("jscoverage-sh_main.js", destination_directory);
  copy_resource("jscoverage-sh_javascript.js", destination_directory);
  copy_resource("jscoverage-sh_nedit.css", destination_directory);
}

/*
coverage reports
*/

struct FileCoverageList {
  FileCoverage * file_coverage;
  struct FileCoverageList * next;
};

struct Coverage {
  JSHashTable * coverage_table;
  struct FileCoverageList * coverage_list;
};

static int compare_strings(const void * p1, const void * p2) {
  return strcmp(p1, p2) == 0;
}

Coverage * Coverage_new(void) {
  Coverage * result = xmalloc(sizeof(Coverage));
  result->coverage_table = JS_NewHashTable(1024, JS_HashString, compare_strings, NULL, NULL, NULL);
  if (result->coverage_table == NULL) {
    fatal("cannot create hash table");
  }
  result->coverage_list = NULL;
  return result;
}

void Coverage_delete(Coverage * coverage) {
  JS_HashTableDestroy(coverage->coverage_table);
  struct FileCoverageList * p = coverage->coverage_list;
  while (p != NULL) {
    free(p->file_coverage->lines);
    free(p->file_coverage->source);
    free(p->file_coverage->id);
    free(p->file_coverage);
    struct FileCoverageList * q = p;
    p = p->next;
    free(q);
  }
  free(coverage);
}

struct EnumeratorArg {
  CoverageForeachFunction f;
  void * p;
};

static intN enumerator(JSHashEntry * entry, intN i, void * arg) {
  struct EnumeratorArg * enumerator_arg = arg;
  enumerator_arg->f(entry->value, i, enumerator_arg->p);
  return 0;
}

void Coverage_foreach_file(Coverage * coverage, CoverageForeachFunction f, void * p) {
  struct EnumeratorArg enumerator_arg;
  enumerator_arg.f = f;
  enumerator_arg.p = p;
  JS_HashTableEnumerateEntries(coverage->coverage_table, enumerator, &enumerator_arg);
}

int jscoverage_parse_json(Coverage * coverage, const uint8_t * json, size_t length) {
  jschar * base = js_InflateString(context, (char *) json, &length);
  if (base == NULL) {
    fatal("out of memory");
  }

  jschar * parenthesized_json = xnew(jschar, addst(length, 2));
  parenthesized_json[0] = '(';
  memcpy(parenthesized_json + 1, base, mulst(length, sizeof(jschar)));
  parenthesized_json[length + 1] = ')';

  JS_free(context, base);

  JSTokenStream * token_stream = js_NewTokenStream(context, parenthesized_json, length + 2, NULL, 1, NULL);
  if (token_stream == NULL) {
    fatal("cannot create token stream");
  }

  JSParseNode * root = js_ParseTokenStream(context, global, token_stream);
  free(parenthesized_json);
  if (root == NULL) {
    return -1;
  }

  /* root node must be TOK_LC */
  if (root->pn_type != TOK_LC) {
    return -1;
  }
  JSParseNode * semi = root->pn_u.list.head;

  /* the list must be TOK_SEMI and it must contain only one element */
  if (semi->pn_type != TOK_SEMI || semi->pn_next != NULL) {
    return -1;
  }
  JSParseNode * parenthesized = semi->pn_kid;

  /* this must be a parenthesized expression */
  if (parenthesized->pn_type != TOK_RP) {
    return -1;
  }
  JSParseNode * object = parenthesized->pn_kid;

  /* this must be an object literal */
  if (object->pn_type != TOK_RC) {
    return -1;
  }

  for (JSParseNode * p = object->pn_head; p != NULL; p = p->pn_next) {
    /* every element of this list must be TOK_COLON */
    if (p->pn_type != TOK_COLON) {
      return -1;
    }

    /* the key must be a string representing the file */
    JSParseNode * key = p->pn_left;
    if (key->pn_type != TOK_STRING || ! ATOM_IS_STRING(key->pn_atom)) {
      return -1;
    }
    char * id_bytes = JS_GetStringBytes(ATOM_TO_STRING(key->pn_atom));

    /* the value must be an object literal OR an array */
    JSParseNode * value = p->pn_right;
    if (! (value->pn_type == TOK_RC || value->pn_type == TOK_RB)) {
      return -1;
    }

    JSParseNode * array = NULL;
    JSParseNode * source = NULL;
    if (value->pn_type == TOK_RB) {
      /* an array */
      array = value;
    }
    else if (value->pn_type == TOK_RC) {
      /* an object literal */
      if (value->pn_count != 2) {
        return -1;
      }
      for (JSParseNode * element = value->pn_head; element != NULL; element = element->pn_next) {
        if (element->pn_type != TOK_COLON) {
          return -1;
        }
        JSParseNode * left = element->pn_left;
        if (left->pn_type != TOK_STRING || ! ATOM_IS_STRING(left->pn_atom)) {
          return -1;
        }
        const char * s = JS_GetStringBytes(ATOM_TO_STRING(left->pn_atom));
        if (strcmp(s, "coverage") == 0) {
          array = element->pn_right;
          if (array->pn_type != TOK_RB) {
            return -1;
          }
        }
        else if (strcmp(s, "source") == 0) {
          source = element->pn_right;
          if (source->pn_type != TOK_STRING || ! ATOM_IS_STRING(source->pn_atom)) {
            return -1;
          }
        }
        else {
          return -1;
        }
      }
    }
    else {
      return -1;
    }

    if (array == NULL) {
      return -1;
    }

    /* look up the file in the coverage table */
    FileCoverage * file_coverage = JS_HashTableLookup(coverage->coverage_table, id_bytes);
    if (file_coverage == NULL) {
      /* not there: create a new one */
      char * id = xstrdup(id_bytes);
      file_coverage = xmalloc(sizeof(FileCoverage));
      file_coverage->id = id;
      file_coverage->num_lines = array->pn_count - 1;
      file_coverage->lines = xnew(int, array->pn_count);
      if (source == NULL) {
        file_coverage->source = NULL;
      }
      else {
        file_coverage->source = xstrdup(JS_GetStringBytes(ATOM_TO_STRING(source->pn_atom)));
      }

      /* set coverage for all lines */
      uint32 i = 0;
      for (JSParseNode * element = array->pn_head; element != NULL; element = element->pn_next, i++) {
        if (element->pn_type == TOK_NUMBER) {
          file_coverage->lines[i] = (int) element->pn_dval;
        }
        else if (element->pn_type == TOK_PRIMARY && element->pn_op == JSOP_NULL) {
          file_coverage->lines[i] = -1;
        }
        else {
          return -1;
        }
      }
      assert(i == array->pn_count);

      /* add to the hash table */
      JS_HashTableAdd(coverage->coverage_table, id, file_coverage);
      struct FileCoverageList * coverage_list = xmalloc(sizeof(struct FileCoverageList));
      coverage_list->file_coverage = file_coverage;
      coverage_list->next = coverage->coverage_list;
      coverage->coverage_list = coverage_list;
    }
    else {
      /* sanity check */
      assert(strcmp(file_coverage->id, id_bytes) == 0);
      if (file_coverage->num_lines != array->pn_count - 1) {
        return -2;
      }

      /* merge the coverage */
      uint32 i = 0;
      for (JSParseNode * element = array->pn_head; element != NULL; element = element->pn_next, i++) {
        if (element->pn_type == TOK_NUMBER) {
          if (file_coverage->lines[i] == -1) {
            return -2;
          }
          file_coverage->lines[i] += (int) element->pn_dval;
        }
        else if (element->pn_type == TOK_PRIMARY && element->pn_op == JSOP_NULL) {
          if (file_coverage->lines[i] != -1) {
            return -2;
          }
        }
        else {
          return -1;
        }
      }
      assert(i == array->pn_count);

      /* if this JSON file has source, use it */
      if (file_coverage->source == NULL && source != NULL) {
        file_coverage->source = xstrdup(JS_GetStringBytes(ATOM_TO_STRING(source->pn_atom)));
      }
    }
  }

  return 0;
}
