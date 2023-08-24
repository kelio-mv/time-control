function Input(props) {
  return <input {...props} onChange={(e) => props.onChange(e.target.value)} />;
}

export default Input;
