/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is SpiderMonkey JSON.
 *
 * The Initial Developer of the Original Code is
 * Mozilla Corporation.
 * Portions created by the Initial Developer are Copyright (C) 1998-1999
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Robert Sayre <sayrer@gmail.com>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either of the GNU General Public License Version 2 or later (the "GPL"),
 * or the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */


#include "jsapi.h"
#include "jsarena.h"
#include "jsarray.h"
#include "jsatom.h"
#include "jsbool.h"
#include "jscntxt.h"
#include "jsdtoa.h"
#include "jsinterp.h"
#include "jsiter.h"
#include "jsnum.h"
#include "jsobj.h"
#include "jsprf.h"
#include "jsscan.h"
#include "jsstr.h"
#include "jstypes.h"
#include "jsutil.h"

#include "json.h"

JSClass js_JSONClass = {
    js_JSON_str,
    JSCLASS_HAS_CACHED_PROTO(JSProto_JSON),
    JS_PropertyStub,  JS_PropertyStub,  JS_PropertyStub,  JS_PropertyStub,
    JS_EnumerateStub, JS_ResolveStub,   JS_ConvertStub,   JS_FinalizeStub,
    JSCLASS_NO_OPTIONAL_MEMBERS
};

JSBool
js_json_parse(JSContext *cx, uintN argc, jsval *vp)
{
    JSString *s = NULL;
    jsval *argv = vp + 2;

    // Must throw an Error if there isn't a first arg
    if (!JS_ConvertArguments(cx, argc, argv, "S", &s))
        return JS_FALSE;


    JSONParser *jp = js_BeginJSONParse(cx, vp);
    JSBool ok = jp != NULL;

    if (ok) {
        ok = js_ConsumeJSONText(cx, jp, JS_GetStringChars(s), JS_GetStringLength(s));
        ok &= js_FinishJSONParse(cx, jp);
    }

    if (!ok)
        JS_ReportError(cx, "Error parsing JSON.");

    return ok;
}

struct StringifyClosure
{
    StringifyClosure(JSContext *aCx, jsval *str) : cx(aCx), s(str)
    {
    }

    JSContext *cx;
    jsval *s;
};

static
JSBool WriteCallback(const jschar *buf, uint32 len, void *data)
{
    StringifyClosure *sc = static_cast<StringifyClosure*>(data);
    JSString *s1 = JSVAL_TO_STRING(*sc->s);
    JSString *s2 = JS_NewUCStringCopyN(sc->cx, buf, len);
    if (!s2)
        return JS_FALSE;

    s1 = js_ConcatStrings(sc->cx, s1, s2);
    if (!s1)
        return JS_FALSE;

    *sc->s = STRING_TO_JSVAL(s1);
    return JS_TRUE;
}

JSBool
js_json_stringify(JSContext *cx, uintN argc, jsval *vp)
{
    JSObject *obj;
    jsval *argv = vp + 2;
    
    // Must throw an Error if there isn't a first arg
    if (!JS_ConvertArguments(cx, argc, argv, "o", &obj))
        return JS_FALSE;

    // Only use objects and arrays as the root for now
    jsval v = OBJECT_TO_JSVAL(obj);
    JSBool ok = js_TryJSON(cx, &v);
    JSType type;
    if (!(ok && !JSVAL_IS_PRIMITIVE(v) &&
          (type = JS_TypeOfValue(cx, v)) != JSTYPE_FUNCTION &&
          type != JSTYPE_XML)) {
        JS_ReportError(cx, "Invalid argument.");
        return JS_FALSE;
    }
    
    JSString *s = JS_NewStringCopyN(cx, "", 0);
    if (!s)
        ok = JS_FALSE;

    if (ok) {
        jsval sv = STRING_TO_JSVAL(s);
        StringifyClosure sc(cx, &sv);
	JSAutoTempValueRooter tvr(cx, 1, sc.s); 
        ok = js_Stringify(cx, &v, NULL, &WriteCallback, &sc, 0);
        *vp = *sc.s;
    }

    return ok;
}

JSBool
js_TryJSON(JSContext *cx, jsval *vp)
{
    // Checks whether the return value implements toJSON()
    JSBool ok = JS_TRUE;
    
    if (!JSVAL_IS_PRIMITIVE(*vp)) {
        JSObject *obj = JSVAL_TO_OBJECT(*vp);
        ok = js_TryMethod(cx, obj, cx->runtime->atomState.toJSONAtom, 0, NULL, vp);
    }
    
    return ok;
}


static const jschar quote = jschar('"');
static const jschar backslash = jschar('\\');
static const jschar unicodeEscape[] = {'\\', 'u', '0', '0'};

static JSBool
write_string(JSContext *cx, JSONWriteCallback callback, void *data, const jschar *buf, uint32 len)
{
    if (!callback(&quote, 1, data))
        return JS_FALSE;

    uint32 mark = 0;
    uint32 i;
    for (i = 0; i < len; ++i) {
        if (buf[i] == quote || buf[i] == backslash) {
            if (!callback(&buf[mark], i - mark, data) || !callback(&backslash, 1, data) ||
                !callback(&buf[i], 1, data)) {
                return JS_FALSE;
            }
            mark = i + 1;
        } else if (buf[i] <= 31 || buf[i] == 127) {
            if (!callback(&buf[mark], i - mark, data) || !callback(unicodeEscape, 4, data))
                return JS_FALSE;
            char ubuf[10];
            unsigned int len = JS_snprintf(ubuf, sizeof(ubuf), "%.2x", buf[i]);
            JS_ASSERT(len == 2);
            // TODO: don't allocate a JSString just to inflate (js_InflateStringToBuffer on static?)
            JSString *us = JS_NewStringCopyN(cx, ubuf, len);
            if (!callback(JS_GetStringChars(us), len, data))
                return JS_FALSE;
            mark = i + 1;
        }
    }

    if (mark < len && !callback(&buf[mark], len - mark, data))
        return JS_FALSE;

    if (!callback(&quote, 1, data))
        return JS_FALSE;

    return JS_TRUE;
}

JSBool
js_Stringify(JSContext *cx, jsval *vp, JSObject *replacer,
             JSONWriteCallback callback, void *data, uint32 depth)
{
    if (depth > JSON_MAX_DEPTH)
        return JS_FALSE; /* encoding error */

    JSBool ok = JS_TRUE;
    JSObject *obj = JSVAL_TO_OBJECT(*vp);
    JSBool isArray = JS_IsArrayObject(cx, obj);
    jschar output = jschar(isArray ? '[' : '{');
    if (!callback(&output, 1, data))
        return JS_FALSE;
    
    JSObject *iterObj = NULL;
    jsint i = 0;
    jsuint length = 0;

    if (isArray) {
        if (!JS_GetArrayLength(cx, obj, &length))
            return JS_FALSE;
    } else {
        if (!js_ValueToIterator(cx, JSITER_ENUMERATE, vp))
            return JS_FALSE;
        iterObj = JSVAL_TO_OBJECT(*vp);
    }

    jsval outputValue = JSVAL_VOID;
    JSAutoTempValueRooter tvr(cx, 1, &outputValue);

    jsval key;
    JSBool memberWritten = JS_FALSE;
    do {
        outputValue = JSVAL_VOID;

        if (isArray) {
            if ((jsuint)i >= length)
                break;
            ok = JS_GetElement(cx, obj, i++, &outputValue);
        } else {
            ok = js_CallIteratorNext(cx, iterObj, &key);
            if (!ok)
                break;
            if (key == JSVAL_HOLE)
                break;

            JSString *ks;
            if (JSVAL_IS_STRING(key)) {
                ks = JSVAL_TO_STRING(key);
            } else {
                ks = JS_ValueToString(cx, key);
                if (!ks) {
                    ok = JS_FALSE;
                    break;
                }
            }

            ok = JS_GetUCProperty(cx, obj, JS_GetStringChars(ks),
                                  JS_GetStringLength(ks), &outputValue);
        }

        if (!ok)
            break;

        // if this is an array, holes are transmitted as null
        if (isArray && outputValue == JSVAL_VOID) {
            outputValue = JSVAL_NULL;
        } else if (JSVAL_IS_OBJECT(outputValue)) {
            ok = js_TryJSON(cx, &outputValue);
            if (!ok)
                break;
        }

        // elide undefined values
        if (outputValue == JSVAL_VOID)
            continue;

        // output a comma unless this is the first member to write
        if (memberWritten) {
            output = jschar(',');
            ok = callback(&output, 1, data);
        if (!ok)
                break;
        }
        memberWritten = JS_TRUE;

        JSType type = JS_TypeOfValue(cx, outputValue);

        // Can't encode these types, so drop them
        if (type == JSTYPE_FUNCTION || type == JSTYPE_XML)
            break;

        // Be careful below, this string is weakly rooted.
        JSString *s;

        // If this isn't an array, we need to output a key
        if (!isArray) {
            s = JS_ValueToString(cx, key);
            if (!s) {
                ok = JS_FALSE;
                break;
            }

            ok = write_string(cx, callback, data, JS_GetStringChars(s), JS_GetStringLength(s));
            if (!ok)
                break;

            output = jschar(':');
            ok = callback(&output, 1, data);
            if (!ok)
                break;
        }

        if (!JSVAL_IS_PRIMITIVE(outputValue)) {
            // recurse
          ok = js_Stringify(cx, &outputValue, replacer, callback, data, depth + 1);
        } else {
            JSString *outputString;
            s = JS_ValueToString(cx, outputValue);
            if (!s) {
                ok = JS_FALSE;
                break;
            }

            if (type == JSTYPE_STRING) {
                ok = write_string(cx, callback, data, JS_GetStringChars(s), JS_GetStringLength(s));
                if (!ok)
                    break;
                
                continue;
            }

            if (type == JSTYPE_NUMBER) {
                if (JSVAL_IS_DOUBLE(outputValue)) {
                    jsdouble d = *JSVAL_TO_DOUBLE(outputValue);
                    if (!JSDOUBLE_IS_FINITE(d))
                        outputString = JS_NewStringCopyN(cx, "null", 4);
                    else
                        outputString = s;
                } else {
                    outputString = s;
                }
            } else if (type == JSTYPE_BOOLEAN) {
                outputString = s;
            } else if (JSVAL_IS_NULL(outputValue)) {
                outputString = JS_NewStringCopyN(cx, "null", 4);
            } else {
                ok = JS_FALSE; // encoding error
                break;
            }

            ok = callback(JS_GetStringChars(outputString), JS_GetStringLength(outputString), data);
        }
    } while (ok);

    if (iterObj) {
        // Always close the iterator, but make sure not to stomp on OK
        ok &= js_CloseIterator(cx, *vp);
        // encoding error or propagate? FIXME: Bug 408838.
    }

    if (!ok) {
        JS_ReportError(cx, "Error during JSON encoding.");
        return JS_FALSE;
    }

    output = jschar(isArray ? ']' : '}');
    ok = callback(&output, 1, data);

    return ok;
}

// helper to determine whether a character could be part of a number
static JSBool IsNumChar(jschar c) 
{
    return ((c <= '9' && c >= '0') || c == '.' || c == '-' || c == '+' || c == 'e' || c == 'E');
}

JSONParser *
js_BeginJSONParse(JSContext *cx, jsval *rootVal)
{
    if (!cx)
        return NULL;

    JSObject *arr = JS_NewArrayObject(cx, 0, NULL);
    if (!arr)
        return NULL;

    JSONParser *jp = (JSONParser*) JS_malloc(cx, sizeof(JSONParser));
    if (!jp)
        return NULL;        
    jp->buffer = NULL;

    jp->objectStack = arr;
    if (!JS_AddRoot(cx, jp->objectStack))
        goto bad;

    jp->hexChar = 0;
    jp->numHex = 0;
    jp->statep = jp->stateStack;
    *jp->statep = JSON_PARSE_STATE_INIT;
    jp->rootVal = rootVal;
    jp->objectKey = NULL;
    jp->buffer = (JSStringBuffer*) JS_malloc(cx, sizeof(JSStringBuffer));
    if (!jp->buffer)
        goto bad;
    js_InitStringBuffer(jp->buffer);

    return jp;
bad:
    JS_free(cx, jp->buffer);
    JS_free(cx, jp);
    return NULL;
}

JSBool
js_FinishJSONParse(JSContext *cx, JSONParser *jp)
{
    if (!jp)
        return JS_TRUE;

    if (jp->buffer)
        js_FinishStringBuffer(jp->buffer);
    
    JS_free(cx, jp->buffer);
    if (!JS_RemoveRoot(cx, jp->objectStack))
        return JS_FALSE;
    JSBool ok = *jp->statep == JSON_PARSE_STATE_FINISHED;
    JS_free(cx, jp);

    return ok;
}


static JSBool
PushState(JSONParser *jp, JSONParserState state)
{
    if (*jp->statep == JSON_PARSE_STATE_FINISHED)
        return JS_FALSE; // extra input

    jp->statep++;
    if ((uint32)(jp->statep - jp->stateStack) >= JS_ARRAY_LENGTH(jp->stateStack))
        return JS_FALSE; // too deep

    *jp->statep = state;

    return JS_TRUE;
}

static JSBool
PopState(JSONParser *jp)
{
    jp->statep--;
    if (jp->statep < jp->stateStack) {
        jp->statep = jp->stateStack;
        return JS_FALSE;
    } 

    if (*jp->statep == JSON_PARSE_STATE_INIT)
        *jp->statep = JSON_PARSE_STATE_FINISHED;

    return JS_TRUE;
}

static JSBool
PushValue(JSContext *cx, JSONParser *jp, JSObject *parent, jsval value)
{
    JSAutoTempValueRooter tvr(cx, 1, &value);
  
    JSBool ok;
    if (OBJ_IS_ARRAY(cx, parent)) {
        jsuint len;
        ok = JS_GetArrayLength(cx, parent, &len);
        if (ok)
            ok = JS_SetElement(cx, parent, len, &value);
    } else {
        ok = JS_DefineUCProperty(cx, parent, JS_GetStringChars(jp->objectKey),
                                 JS_GetStringLength(jp->objectKey), value,
                                 NULL, NULL, JSPROP_ENUMERATE);
    }

    return ok;
}

static JSBool
PushObject(JSContext *cx, JSONParser *jp, JSObject *obj)
{
    jsuint len;
    if (!JS_GetArrayLength(cx, jp->objectStack, &len))
        return JS_FALSE;
    if (len >= JSON_MAX_DEPTH)
        return JS_FALSE; // decoding error

    jsval v = OBJECT_TO_JSVAL(obj);

    // Check if this is the root object
    if (len == 0) {
        *jp->rootVal = v;        
        if (!JS_SetElement(cx, jp->objectStack, 0, jp->rootVal))
            return JS_FALSE;
        return JS_TRUE;
    }

    jsval p;
    if (!JS_GetElement(cx, jp->objectStack, len - 1, &p))
        return JS_FALSE;
    JS_ASSERT(JSVAL_IS_OBJECT(p));
    JSObject *parent = JSVAL_TO_OBJECT(p);
    if (!PushValue(cx, jp, parent, OBJECT_TO_JSVAL(obj)))
        return JS_FALSE;

    if (!JS_SetElement(cx, jp->objectStack, len, &v))
        return JS_FALSE;

    return JS_TRUE;
}

static JSBool
OpenObject(JSContext *cx, JSONParser *jp)
{
    JSObject *obj = JS_NewObject(cx, NULL, NULL, NULL);
    if (!obj)
        return JS_FALSE;

    return PushObject(cx, jp, obj);
}

static JSBool
OpenArray(JSContext *cx, JSONParser *jp)
{
    // Add an array to an existing array or object
    JSObject *arr = JS_NewArrayObject(cx, 0, NULL);
    if (!arr)
        return JS_FALSE;

    return PushObject(cx, jp, arr);
}

static JSBool
CloseObject(JSContext *cx, JSONParser *jp)
{
    jsuint len;
    if (!JS_GetArrayLength(cx, jp->objectStack, &len))
        return JS_FALSE;
    if (!JS_SetArrayLength(cx, jp->objectStack, len - 1))
        return JS_FALSE;

    return JS_TRUE;
}

static JSBool
CloseArray(JSContext *cx, JSONParser *jp)
{
  return CloseObject(cx, jp);
}

static JSBool
HandleNumber(JSContext *cx, JSONParser *jp, const jschar *buf, uint32 len)
{
    JSBool ok;
    jsuint length;
    if (!JS_GetArrayLength(cx, jp->objectStack, &length))
        return JS_FALSE;

    jsval o;
    if (!JS_GetElement(cx, jp->objectStack, length - 1, &o))
        return JS_FALSE;
    JS_ASSERT(JSVAL_IS_OBJECT(o));
    JSObject *obj = JSVAL_TO_OBJECT(o);

    const jschar *ep;
    double val;    
    if (!js_strtod(cx, buf, buf + len, &ep, &val) || ep != buf + len)
        return JS_FALSE;

    jsval numVal;
    if (JS_NewNumberValue(cx, val, &numVal))
        ok = PushValue(cx, jp, obj, numVal);
    else
        ok = JS_FALSE; // decode error

    return ok;
}

static JSBool
HandleString(JSContext *cx, JSONParser *jp, const jschar *buf, uint32 len)
{
    jsuint length;
    if (!JS_GetArrayLength(cx, jp->objectStack, &length))
        return JS_FALSE;

    jsval o;
    if (!JS_GetElement(cx, jp->objectStack, length - 1, &o))
        return JS_FALSE;
    JS_ASSERT(JSVAL_IS_OBJECT(o));
    JSObject *obj = JSVAL_TO_OBJECT(o);

    JSString *str = JS_NewUCStringCopyN(cx, buf, len);
    if (!str)
        return JS_FALSE;

    return PushValue(cx, jp, obj, STRING_TO_JSVAL(str));
}

static JSBool
HandleKeyword(JSContext *cx, JSONParser *jp, const jschar *buf, uint32 len)
{
    jsval keyword;
    JSTokenType tt = js_CheckKeyword(buf, len);
    if (tt != TOK_PRIMARY)
        return JS_FALSE;

    if (buf[0] == 'n')
        keyword = JSVAL_NULL;
    else if (buf[0] == 't')
        keyword = JSVAL_TRUE;
    else if (buf[0] == 'f')
        keyword = JSVAL_FALSE;
    else
        return JS_FALSE;

    jsuint length;
    if (!JS_GetArrayLength(cx, jp->objectStack, &length))
        return JS_FALSE;

    jsval o;
    if (!JS_GetElement(cx, jp->objectStack, length - 1, &o))
        return JS_FALSE;
    JS_ASSERT(JSVAL_IS_OBJECT(o));
    JSObject *obj = JSVAL_TO_OBJECT(o);

    return PushValue(cx, jp, obj, keyword);
}

static JSBool
HandleData(JSContext *cx, JSONParser *jp, JSONDataType type, const jschar *buf, uint32 len)
{
  JSBool ok = JS_FALSE;

  switch (type) {
    case JSON_DATA_STRING:
      ok = HandleString(cx, jp, buf, len);
      break;

    case JSON_DATA_KEYSTRING:
      jp->objectKey = JS_NewUCStringCopyN(cx, buf, len);
      ok = JS_TRUE;
      break;

    case JSON_DATA_NUMBER:
      ok = HandleNumber(cx, jp, buf, len);
      break;

    case JSON_DATA_KEYWORD:
      ok = HandleKeyword(cx, jp, buf, len);
      break;

    default:
      JS_NOT_REACHED("Should have a JSON data type");
  }

  js_FinishStringBuffer(jp->buffer);
  js_InitStringBuffer(jp->buffer);

  return ok;
}

JSBool
js_ConsumeJSONText(JSContext *cx, JSONParser *jp, const jschar *data, uint32 len)
{
    uint32 i;

    if (*jp->statep == JSON_PARSE_STATE_INIT) {
        PushState(jp, JSON_PARSE_STATE_OBJECT_VALUE);
    }

    for (i = 0; i < len; i++) {        
        jschar c = data[i];
        switch (*jp->statep) {
            case JSON_PARSE_STATE_VALUE :
                if (c == ']') {
                    // empty array
                    if (!PopState(jp))
                        return JS_FALSE;
                    if (*jp->statep != JSON_PARSE_STATE_ARRAY) 
                        return JS_FALSE; // unexpected char
                    if (!CloseArray(cx, jp) || !PopState(jp))
                        return JS_FALSE;
                    break;
                }

                if (c == '}') {
                    // we should only find these in OBJECT_KEY state
                    return JS_FALSE; // unexpected failure
                }

                if (c == '"') {
                    *jp->statep = JSON_PARSE_STATE_STRING;
                    break;
                } 

                if (IsNumChar(c)) {
                    *jp->statep = JSON_PARSE_STATE_NUMBER;
                    js_AppendChar(jp->buffer, c);
                    break;
                }

                if (JS7_ISLET(c)) {
                    *jp->statep = JSON_PARSE_STATE_KEYWORD;
                    js_AppendChar(jp->buffer, c);
                    break;
                }

            // fall through in case the value is an object or array
            case JSON_PARSE_STATE_OBJECT_VALUE :
                if (c == '{') {
                  *jp->statep = JSON_PARSE_STATE_OBJECT;
                  if (!OpenObject(cx, jp) || !PushState(jp, JSON_PARSE_STATE_OBJECT_PAIR))
                      return JS_FALSE;
                } else if (c == '[') {
                  *jp->statep = JSON_PARSE_STATE_ARRAY;
                  if (!OpenArray(cx, jp) || !PushState(jp, JSON_PARSE_STATE_VALUE))
                      return JS_FALSE;
                } else if (!JS_ISXMLSPACE(c)) {
                  return JS_FALSE; // unexpected
                }
                break;

            case JSON_PARSE_STATE_OBJECT :
                if (c == '}') {                    
                    if (!CloseObject(cx, jp) || !PopState(jp))
                        return JS_FALSE;
                } else if (c == ',') {
                    if (!PushState(jp, JSON_PARSE_STATE_OBJECT_PAIR))
                        return JS_FALSE;
                } else if (c == ']' || !JS_ISXMLSPACE(c)) {
                    return JS_FALSE; // unexpected
                }
                break;

            case JSON_PARSE_STATE_ARRAY :
                if (c == ']') {
                    if (!CloseArray(cx, jp) || !PopState(jp))
                        return JS_FALSE;
                } else if (c == ',') {
                    if (!PushState(jp, JSON_PARSE_STATE_VALUE))
                        return JS_FALSE;
                } else if (!JS_ISXMLSPACE(c)) {
                    return JS_FALSE; // unexpected
                }
                break;
            case JSON_PARSE_STATE_OBJECT_PAIR :
                if (c == '"') {
                    // we want to be waiting for a : when the string has been read
                    *jp->statep = JSON_PARSE_STATE_OBJECT_IN_PAIR;
                    if (!PushState(jp, JSON_PARSE_STATE_STRING))
                        return JS_FALSE;
                } else if (c == '}') {
                    // pop off the object pair state and the object state
                    if (!CloseObject(cx, jp) || !PopState(jp) || !PopState(jp))
                        return JS_FALSE;
                } else if (c == ']' || !JS_ISXMLSPACE(c)) {
                  return JS_FALSE; // unexpected
                }
                break;
            case JSON_PARSE_STATE_OBJECT_IN_PAIR:
                if (c == ':') {
                    *jp->statep = JSON_PARSE_STATE_VALUE;
                } else if (!JS_ISXMLSPACE(c)) {
                    return JS_FALSE; // unexpected
                }
                break;
            case JSON_PARSE_STATE_STRING:
                if (c == '"') {
                    if (!PopState(jp))
                        return JS_FALSE;
                    JSONDataType jdt;
                    if (*jp->statep == JSON_PARSE_STATE_OBJECT_IN_PAIR) {
                        jdt = JSON_DATA_KEYSTRING;
                    } else {
                        jdt = JSON_DATA_STRING;
                    }
                    if (!HandleData(cx, jp, jdt, jp->buffer->base, STRING_BUFFER_OFFSET(jp->buffer)))
                        return JS_FALSE;
                } else if (c == '\\') {
                    *jp->statep = JSON_PARSE_STATE_STRING_ESCAPE;
                } else {
                    js_AppendChar(jp->buffer, c);
                }
                break;
        
            case JSON_PARSE_STATE_STRING_ESCAPE:
                switch(c) {
                    case '"':
                    case '\\':
                    case '/':
                        break;
                    case 'b' : c = '\b'; break;
                    case 'f' : c = '\f'; break;
                    case 'n' : c = '\n'; break;
                    case 'r' : c = '\r'; break;
                    case 't' : c = '\t'; break;
                    default :
                        if (c == 'u') {
                            jp->numHex = 0;
                            jp->hexChar = 0;
                            *jp->statep = JSON_PARSE_STATE_STRING_HEX;
                            continue;
                        } else {
                            return JS_FALSE; // unexpected
                        }
                }

                js_AppendChar(jp->buffer, c);
                *jp->statep = JSON_PARSE_STATE_STRING;
                break;
            case JSON_PARSE_STATE_STRING_HEX:
                if (('0' <= c) && (c <= '9'))
                  jp->hexChar = (jp->hexChar << 4) | (c - '0');
                else if (('a' <= c) && (c <= 'f'))
                  jp->hexChar = (jp->hexChar << 4) | (c - 'a' + 0x0a);
                else if (('A' <= c) && (c <= 'F'))
                  jp->hexChar = (jp->hexChar << 4) | (c - 'A' + 0x0a);
                else
                  return JS_FALSE; // unexpected

                if (++(jp->numHex) == 4) {
                    js_AppendChar(jp->buffer, jp->hexChar);
                    jp->hexChar = 0;
                    jp->numHex = 0;
                    *jp->statep = JSON_PARSE_STATE_STRING;
                }
                break;
            case JSON_PARSE_STATE_KEYWORD:
                if (JS7_ISLET(c)) {
                    js_AppendChar(jp->buffer, c);
                } else {
                    // this character isn't part of the keyword, process it again
                    i--;
                    if(!PopState(jp))
                        return JS_FALSE;
                
                    if (!HandleData(cx, jp, JSON_DATA_KEYWORD, jp->buffer->base, STRING_BUFFER_OFFSET(jp->buffer)))
                        return JS_FALSE;
                }
                break;
            case JSON_PARSE_STATE_NUMBER:
                if (IsNumChar(c)) {
                    js_AppendChar(jp->buffer, c);
                } else {
                    // this character isn't part of the number, process it again
                    i--;
                    if(!PopState(jp))
                        return JS_FALSE;
                    if (!HandleData(cx, jp, JSON_DATA_NUMBER, jp->buffer->base, STRING_BUFFER_OFFSET(jp->buffer)))
                        return JS_FALSE;
                }
                break;
            case JSON_PARSE_STATE_FINISHED:
                if (!JS_ISXMLSPACE(c))
                  return JS_FALSE; // extra input

                break;
            default:
                JS_NOT_REACHED("Invalid JSON parser state");
      }
    }

    return JS_TRUE;
}

#if JS_HAS_TOSOURCE
static JSBool
json_toSource(JSContext *cx, uintN argc, jsval *vp)
{
    *vp = ATOM_KEY(CLASS_ATOM(cx, JSON));
    return JS_TRUE;
}
#endif

static JSFunctionSpec json_static_methods[] = {
#if JS_HAS_TOSOURCE
    JS_FN(js_toSource_str,  json_toSource,      0, 0),
#endif
    JS_FN("parse",          js_json_parse,      0, 0),
    JS_FN("stringify",      js_json_stringify,  0, 0),
    JS_FS_END
};

JSObject *
js_InitJSONClass(JSContext *cx, JSObject *obj)
{
    JSObject *JSON;

    JSON = JS_NewObject(cx, &js_JSONClass, NULL, obj);
    if (!JSON)
        return NULL;
    if (!JS_DefineProperty(cx, obj, js_JSON_str, OBJECT_TO_JSVAL(JSON),
                           JS_PropertyStub, JS_PropertyStub, JSPROP_ENUMERATE))
        return NULL;

    if (!JS_DefineFunctions(cx, JSON, json_static_methods))
        return NULL;

    return JSON;
}
