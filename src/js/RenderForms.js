import { FetchLocalHtml } from "./fetchLocalHtml.js";

import { SignUpForm } from "./signUpForm.js";
import { LoginForm } from "./loginForm.js";

export { renderforms };

// window.closeForm = closeForm;
// window.changeToLoginForm = changeToLoginForm;
// window.changeToSignUpForm = changeToSignUpForm;

let formPlaceholder = "form-placeholder";

class FormHTMLRender extends FetchLocalHtml {
  constructor(placeholder, htmlFileName) {
    super(placeholder, htmlFileName);
    this._forms;
    // this.signUpForm;
    // this.loginForm;
  }

  replace(formsHTML) {
    const parser = new DOMParser();
    const formsDoc = parser.parseFromString(formsHTML, "text/html");
    this._forms = formsDoc.querySelector(".wrapper").children;
    // this.signUpForm = this._forms[0];
    // this.loginForm = this._forms[1];
    this.placeholder.replaceWith(...this._forms);
    // return this._forms;
  }
}

let renderforms = new FormHTMLRender(formPlaceholder, "form.html");
let signUpForm;
let loginForm;

async function initialize() {
  try {
    const formsHTML = await renderforms.fetchHtmlFileContent();
    renderforms.replace(formsHTML);
    signUpForm = new SignUpForm();
    loginForm = new LoginForm();
  } catch (error) {
    console.error(error);
  }
}

await initialize();

export { signUpForm, loginForm };
