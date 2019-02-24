class SelectItem extends HTMLElement {
  constructor() {
    super();

    console.log(this);
  }
}

customElements.define("select-item", SelectItem);
