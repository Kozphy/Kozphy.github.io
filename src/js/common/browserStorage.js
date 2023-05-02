export { browserStorage };

class BrowserStorage {
  constructor() {}

  getStorageData(storageObject, objectName) {
    let datasInStorage = storageObject.getItem(objectName);

    if (!datasInStorage) {
      return [];
    }

    let datas = [...JSON.parse(datasInStorage)];
    return datas;
  }

  setStorageData(storageObject, objectName, newDatas) {
    // let storageDatas = this.getStorageData(storageObject, objectName);
    // if (!storageDatas) {
    //   storageObject.setItem(objectName, JSON.stringify([newData]));
    //   return;
    // }
    // let newStorageDatas;
    // newStorageDatas = storageDatas;
    // storageDatas.push(newData);
    //TODO:
    storageObject.setItem(objectName, JSON.stringify(newDatas));
  }

  removeStorageData(storageObject, objectName, newDatas) {
    if (!newDatas.length) {
      storageObject.removeItem(objectName);
      return;
    }

    this.setStorageData(storageObject, objectName, newDatas);
  }
}

let browserStorage = new BrowserStorage();
