import { Container, Inject } from "..";

//PRC Demo实现
let RPC = {
  config: function(_cfg: { serviceUrl: string; interfaces: Function[] }) {
    if (_cfg.interfaces) {
      _cfg.interfaces.forEach((_type: FunctionConstructor) => {
        if (_type.prototype) {
          let newObj = {},
            proto = _type.prototype;
          let nms = Object.getOwnPropertyNames(proto);
          if (nms) {
            nms.forEach(nm => {
              if (nm != "constructor" && typeof proto[nm] === "function") {
                newObj[nm] = function() {
                  ////{nm:方法名,arguments:参数表},改为调用远程请求过程
                  return arguments[0]; //test return
                };
              }
            });
          }
          Container.provides([
            _type,
            () => {
              return newObj;
            }
          ]);
        }
      });
    }
  }
};

//--DEMO--------------------------------------------------------

//1. 接口声明（注意,此处只能使用Concrete class）
class Product {
  getById(id: string): string {
    return null;
  }
}

//2. 应用RPC Framework
RPC.config({
  serviceUrl: null,
  interfaces: [Product] //提供接口描述，在RPC中构建factory
});

//3. Service class
@Inject
class Service {
  @Inject
  product: Product;

  test() {
    let id: string = "tid";
    let rst = this.product.getById(id);
    console.log(rst);
  }
}

//4.测试
Container.getObject<Service>('service').test();
