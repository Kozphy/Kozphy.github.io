class OperationFactory {
  constructor() {
    this.oper = null;
    switch (oper) {
      case "+":
        this.oper = new OperAdd();
        break;
      case "-":
        this.oper = new OperSub();
        break;
    }
  }
}

class Operation {
  constructor() {}
}

class OperAdd {
  constructor() {}
}

class OperSub {
  constructor() {}
}
