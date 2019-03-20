import { Container, Inject } from "..";

class User {
  id: string = "testId";
  name: string = "testName";
}

abstract class UserService {
  abstract getUser(id: string): User;
}

// 1. 注册Provider(实现类 或 工厂)
// 形式一：形如 Container.provides(class extends UserService{})
Container.provides(
  class extends UserService {
    getUser(_id: string): User {
      console.log(1);
      return new User();
    }
  }
);

//或者

// 形式二：形如 Container.provides([UserService,FactoryFunction])
Container.provides([
  UserService,
  () => {
    return new class extends UserService {
      getUser(_id: string): User {
        console.log(2);
        return new User();
      }
    }();
  }
]);

// 2. 依赖注入
@Inject
class Control {
  @Inject
  userService: UserService;

  test() {
    let user: User = this.userService.getUser("test");
    console.log(user);
  }
}

Container.getObject<Control>('control').test();
