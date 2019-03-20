import { Container, Inject } from "..";

class User {
  id: string = "testId";
  name: string = "testName";
}

class UserService {
  getUser(_id: string): User {
    return new User();
  }
}

@Inject
class ControlDefault {
  @Inject
  userService: UserService;

  test() {
    let user: User = this.userService.getUser("test");
    console.log(user);
  }
}

@Inject('controllor-with-args', new Date())
class ControlDefaultWithArgs {
  name: string;
  time: Date;

  constructor(name: string, time: Date) {
    this.name = name;
    this.time = time;
  }

  @Inject
  userService: UserService;

  test() {
    let user: User = this.userService.getUser("test");
    console.log(user, this.name, this.time);
  }
}

@Inject('controllor1', 'util', new Date())
class Control {
  name: string;
  time: Date;

  constructor(name: string, time: Date) {
    this.name = name;
    this.time = time;
  }

  @Inject
  userService: UserService;

  test() {
    let user: User = this.userService.getUser("test");
    console.log(user, this.name, this.time);
  }
}

Container.getObject<ControlDefault>('controlDefault').test();
Container.getObject<ControlDefaultWithArgs>('controlDefaultWithArgs').test();
Container.getObject<Control>('controllor1').test();
