const container = document.getElementById("root");
const a = true;

const RedWrapper = ({ children }) => (
    <div style={{ background: 'red', padding: 10 }}>{children}</div>
);

const BlueWrapper = ({ children }) => (
    <div style={{ background: 'blue', padding: 10 }}>{children}</div>
);


ReactDOM.render((

    <button $wrp={[BlueWrapper, RedWrapper]} prop2={234}>
        The button
    </button>

), container);