import "./Modal.scss";

function Modal(props) {
  return (
    props.open && (
      <div className="modal">
        <div className="modal__content">
          <header className="modal__header">
            <h1>{props.header}</h1>
            <svg width={16} height={16} style={{ cursor: "pointer" }} onClick={props.close}>
              <line x1={2} y1={2} x2={14} y2={14} stroke="#4b5563" strokeWidth={3} />
              <line x1={14} y1={2} x2={2} y2={14} stroke="#4b5563" strokeWidth={3} />
            </svg>
          </header>
          <div className="modal__body">{props.children}</div>
          <footer className="modal__footer">{props.footer}</footer>
        </div>
      </div>
    )
  );
}

export default Modal;
