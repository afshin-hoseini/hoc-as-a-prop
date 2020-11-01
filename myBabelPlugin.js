const { parse } = require('@babel/parser');
const traverse = require('@babel/traverse').default;

/**
 * @typedef {import('@babel/traverse').Visitor} Visitor
 * @typedef {import('@babel/types').ObjectProperty} ObjectProperty
 * @typedef {import('@babel/types').ObjectExpression} ObjectExpression
 * @typedef {import('@babel/types').CallExpression} CallExpression
 * @typedef {import('@babel/types').ArrayExpression} ArrayExpression
 * @typedef {import('@babel/traverse').NodePath<ObjectProperty>} ObjectPropertyNode
 * @typedef {import('@babel/types')} Types
 */


function createWrapperCode(wrapper, index = 0, childToken) {

    let tagName = "";
    let value = wrapper.get("value");
    let childCode = `"${childToken || "CHILD**"}"`;

    if (value.isArrayExpression()) {

        const length = value.get("elements").length;
        value = value.get(`elements.${index}`);
        const nextElementIndex = index + 1;
        if (nextElementIndex < length)
            childCode = createWrapperCode(wrapper, nextElementIndex, childToken);
    }

    if (value.isStringLiteral()) {
        tagName = `"${value.node.value}"`;
    }
    else if (value.isIdentifier()) {
        tagName = value.node.name;
    }
    else {
        tagName = "UNDEFINED"
    }

    return `React.createElement(
        ${tagName},
        null,
        ${childCode}
      )`;
}

function wrapWithWrapper(hoc, childPath) {

    const childToken = "!CHILD";
    const wrapperCode = createWrapperCode(hoc, 0, childToken);

    const ast = parse(wrapperCode);

    traverse(ast, {
        CallExpression(path) {

            if (path.get('arguments.2').get("value").node === childToken) {

                const argsNode = path.get("arguments");
                argsNode[2].replaceWith(childPath.node);
                path.stop();
            }

        },
        exit(path) {

            if (path.isProgram()) {
                const topMostWrapperElement = path.get("body.0").get("expression");
                childPath.replaceWith(topMostWrapperElement.node);
                childPath.stop();
                path.stop();
            }
        }


    })
}

/**
 * 
 * @param {{types: Types}} param0 
 */
module.exports = function myCustomPlugin({ types }) {
    /** 
     * @type Visitor
     */
    const visitor = {
        CallExpression(path) {

            if (
                path.get("callee").get("object").isIdentifier({ name: "React" }) &&
                path.get("callee").get("property").isIdentifier({ name: "createElement" })
            ) {

                let args = path.get("arguments");
                let propsObject = args.find(arg => arg.isObjectExpression())

                if (!propsObject) return;

                /** @type ObjectPropertyNode[] */
                let props = propsObject.get("properties");
                if (!props) return;

                /** @type ObjectPropertyNode */
                const wrapperProp = props.find(p => p.get("key").isIdentifier({ name: "$wrp" }));
                if (!wrapperProp) return;

                /** Removes the hoc wrapper */
                const newProps = props.filter(p => p != wrapperProp);
                /** Updates the node with filtered properties */
                propsObject.node.properties = newProps.map(p => p.node);

                wrapWithWrapper(
                    wrapperProp,
                    path
                );

            }

        },
    };

    return { visitor };
}