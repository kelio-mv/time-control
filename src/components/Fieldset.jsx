import "./Fieldset.scss";

function Fieldset(props) {
  return (
    <section className="fieldset" style={props.style}>
      <p className="fieldset__legend">{props.legend}</p>
      {props.children}
    </section>
  );
}

export default Fieldset;
