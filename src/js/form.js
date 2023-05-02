import { browserStorage } from "./common/browserStorage.js";

export { Form };

class Form {
  constructor() {
    this.outerClickCloseForm();
  }
  formDataToObject(formData) {
    const obj = {};
    for (const [key, value] of formData.entries()) {
      obj[key] = value;
    }
    return obj;
  }

  checkUserExist(formData) {
    const formDataEmail = formData.get("email");

    const datasInStorage = browserStorage.getStorageData(
      this.storage,
      this.storageDataName
    );

    for (let user of datasInStorage) {
      const { email: emailInStorage } = user;

      if (emailInStorage == formDataEmail) {
        return [true, datasInStorage];
      }
    }
    return [false, datasInStorage];
  }
}
