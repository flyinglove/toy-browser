const EOF = Symbol('EOF')

let currentToken = null
let currentAttribute = null
let stack = [{type: 'document', children: []}]
let currentTextNode = ''
function emit(token) {
    let top = stack[stack.length - 1]
    if (token.type === 'startTag') {
        let element = {
            type: 'element',
            attributes: [],
            children: []
        }
        element.tagName = token.tagName
        for (let p in token) {
            if (p != 'type' && p != 'tagName') {
                element.attributes.push({
                    name: p,
                    value: token[p] 
                })
            }
        }
        top.children.push(element)
        element.parent = top
        if (!token.isSelfClosing) {
            stack.push(element)
        }
        currentTextNode = null
    } else if (token.type === 'endTag'){
        // console.log(top.tagName, token.tagName)
        if (top.tagName !== token.tagName) {
            throw new Error('aa')
        } else {
            stack.pop()
        }
        currentTextNode = null
    } else if (token.type === 'text') {
        if (currentTextNode === null) {
            currentTextNode = {
                type: 'text',
                content: ''
            }
            top.children.push(currentTextNode)
        }
        currentTextNode.content += token.content
    }
    if (token.type != 'text') {
        console.log(token)
    }
}
// 开始标签， 结束标签，自封闭标签
function data(c) {
    if (c === '<') {
        return tagOpen
    }
    if (c === EOF) {
        emit({
            type: 'EOF'
        })
        return
    }
    emit({
        type: 'text',
        content: c
    })
    return data
}
function tagOpen(c) {
    if (c === '/') {
        return endTagOpen
    }
    if (c.match(/^[a-zA-Z]$/)) {
        currentToken = {
            type: 'startTag',
            tagName: ''

        }
        return tagName(c)
    }
    return;
}

function endTagOpen(c) {
    if(c.match(/^[a-zA-Z]$/)) {
        currentToken = {
            type: 'endTag',
            tagName: ''
        }
        return tagName(c)
    }
    if (c === '>') {
        return data
    }
    if (c === EOF) {

    }

}
function tagName(c) {
    if (c.match(/^[\t\n\f ]$/)) {
        return beforeAttributeName
    }
    if (c === '/') {
        return selfClosingStartTag
    }
    if (c.match(/^[a-zA-Z]$/)) {
        currentToken.tagName += c.toLowerCase()
        return tagName
    } 
    if (c === '>') {
        emit(currentToken)
        return data
    }
    return tagName
}

function beforeAttributeName(c) {
    if (c.match(/^[\t\n\\f ]$/)) {
        return beforeAttributeName
    }
    if (c === '/' || c=== '>' || c === EOF) {
        return afterAttributeName(c)
    }
    if (c === '=') {
        return beforeAttributeName
    }
   currentAttribute = {
       name: '',
       value: ''
   }
   return attributeName(c)
}

function attributeName(c) {
    if (c.match(/^[\t\n\f ]$/) || c === '/' || c === '>' || c === EOF) {
        return afterAttributeName(c)
    }
    if (c=== '=') {
        return beforeAttributeValue
    }
    if (c === '\u0000') {}
    currentAttribute.name += c
    return attributeName
}
function beforeAttributeValue(c) {
    if (c.match(/^[\t\n\f ]$/) || c === '/' || c === '>' || c === EOF) {
        return beforeAttributeValue
    }
    if (c === '\"') {
        return doubleQuotedAttributeValue
    }
    if (c === '\'') {
        return singleQuotedAttributeValue
    }
    if (c === '>') {

    }
    return unquotedAttributeValue
}
function doubleQuotedAttributeValue(c) {
    if (c === '\"') {
        currentToken[currentAttribute.name] = currentAttribute.value
        return afterQuotedAttributeValue
    }
    currentAttribute.value += c
    return doubleQuotedAttributeValue
}
function singleQuotedAttributeValue(c) {
    if (c === '\'') {
        currentToken[currentAttribute.name] = currentAttribute.value
        return afterQuotedAttributeValue
    }
    currentAttribute.value += c
    return singleQuotedAttributeValue
}
function afterQuotedAttributeValue(c) {
    if (c.match(/^[\t\n\f ]$/)) {
        return beforeAttributeName
    }
    if (c === '/') {
        return selfClosingStartTag
    }
    if (c === '>') {
        currentToken[currentAttribute.name] = currentAttribute.value
        emit(currentToken)
        return data
    }
    currentAttribute.value += c
    return doubleQuotedAttributeValue
}
function unquotedAttributeValue(c) {
    if (c.match(/^[\t\n\f ]$/)) {
        currentToken[currentAttribute.name] = currentAttribute.value
        return beforeAttributeName
    }
    if (c === '/') {
        currentToken[currentAttribute.name] = currentAttribute.value
        return selfClosingStartTag
    }
    if (c === '>') {
        currentToken[currentAttribute.name] = currentAttribute.value
        emit(currentToken)
        return data
    }
    if (c === '\u0000') {

    }
    currentAttribute.value += c
    return unquotedAttributeValue
    
}
function selfClosingStartTag(c) {
    if (c === '>') {
        currentToken.isSelfClosing = true
        return data
    }
    
}
module.exports.parserHTML = function parserHTML(html) {
    let state = data
    for (let c of html) {
        state = state(c)
    }
    state = state(EOF)
    console.log(stack[0].children)
}