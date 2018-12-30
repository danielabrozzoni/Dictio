
class HelloMessage extends React.Component {
  render() {
    return (
      <div>
        Hello {this.props.name}
      </div>
    );
  }
}

ReactDOM.render(
    <div>Ciao mondone</div>,
    document.getElementById('app')
);
