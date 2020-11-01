/**
 * @typedef {import('@babel/traverse').Visitor} Visitor
 * @typedef {import('@babel/types').ObjectProperty} ObjectProperty
 * @typedef {import('@babel/types').ObjectExpression} ObjectExpression
 * @typedef {import('@babel/types').CallExpression} CallExpression
 */

module.exports = function myCustomPlugin() {
    /** 
     * @type Visitor
     */
    const visitor = {
        Identifier(path) {
            if (path.node.name === "createElement") {
                const parent = path.parentPath;


                if (parent.get("object").get("name").node === 'React') {

                    /** @type CallExpression */
                    const reactNode = parent.parentPath;
                    const args = reactNode.node.arguments;


                    /** @type ObjectExpression*/
                    const propsParam = args.find(arg => arg.type === "ObjectExpression");

                    /** @type ObjectProperty[] */
                    let props = propsParam.properties;


                    /** @type ObjectProperty */
                    const hocWrapper = props.find(p => p.key.name === "$hoc");
                    const newProps = props.filter(prop => prop != hocWrapper);

                    propsParam.properties = newProps;


                    const reactNodeAst = parent.parentPath;
                    const wrapperAst = { ...reactNodeAst };
                    wrapperAst.node.arguments[0] = hocWrapper.value.value;
                    wrapperAst.node.arguments[1] = null;
                    wrapperAst.node.arguments[2] = reactNodeAst;

                    reactNodeAst.replaceWith(wrapperAst);
                    reactNodeAst.stop();

                }
            }

        },
    };

    return { visitor };
}