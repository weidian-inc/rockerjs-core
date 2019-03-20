import { contextConfiguration, Test, run, OnlyRun, Describe, before, after } from '@rockerjs/tsunit';
import { InjectSpec } from "./inject.spec";
import { ContainerSpec } from "./container.spec";
import { AopSpec } from "./aop.spec";
import { AopAnnotationSpec } from "./aop.annotation_pointcut.spec";
import { ExceptionInject } from "./exception.spec";

run(new InjectSpec());
run(new ContainerSpec());
run(new AopSpec());
run(new AopAnnotationSpec());

new ExceptionInject().testException();
new ExceptionInject().normalFunction();
new ExceptionInject().testAsyncException();
ExceptionInject.testStaticException();