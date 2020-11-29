import "reflect-metadata";

interface Type<T> {
  new (...args: unknown[]): T;
}
type GenericClassDecorator<T> = (target: T) => void;

export const Injectable = (): GenericClassDecorator<Type<unknown>> => {
  return (_) => {};
};

export class DependencyContainer {
  private resolvedClasses = new Map();

  public install(target: Type<unknown>, instance: unknown) {
    this.resolvedClasses.set(target, instance);
  }

  private resolve<T>(target: Type<unknown>, dependencyTree: Type<unknown>[]): T {
    if (this.resolvedClasses.has(target)) {
      return this.resolvedClasses.get(target);
    }

    if (dependencyTree.includes(target)) {
      throw new Error("=== CIRCULAR DEPENDENCY DETECTED ====");
    }

    dependencyTree.push(target);

    const paramTypes = Reflect.getMetadata("design:paramtypes", target);

    if (paramTypes == null) {
      throw new Error(
        `Type "${target.name}" not found. Did you forget to add @Injectable()?`
      );
    }

    const params = paramTypes.map((p: Type<unknown>) =>
      this.resolve<unknown>(p, dependencyTree)
    );

    const instance = new target(...params);

    this.resolvedClasses.set(target, instance);
    return instance as T;
  }

  public get<T>(target: Type<unknown>): T {
    return this.resolve(target, []);
  }

  public bootstrap(classes: Type<unknown>[]) {
    classes.forEach((c) => this.get<unknown>(c));
  }
}
