import { Container, Inject } from '..';

abstract class GetTransData {
  p0: number
  constructor(p0: number, p1: string) {
      console.log(p0 + p1)
      this.p0 = p0
  }

  abstract async getDetail(_proId: number): Promise<string>;
}

@Inject
class SomeControl {
  //场景3.无构造函数或参数为空
  @Inject(666, 2)
  transGet: GetTransData;

  async getProduct(_productId?: number) {
      let json: any = await this.transGet.getDetail(_productId);
      console.log(json);
  }
}

//指定类型的工厂函数
Container.provides([GetTransData, (_p0, _p1) => {
  return new class extends GetTransData {
      constructor(p0: number, p1: string) {
          super(p0, p1);
      }

      async getDetail(_id: number): Promise<string> {
          await  ((ms) => new Promise(res => setTimeout(res, ms)))(100)
          return `Hello ${this.p0}`
      }
  }(_p0, _p1);
}]);

Container.getObject<SomeControl>('someControl').getProduct();

