import "reflect-metadata";

export interface Type<T> {
  new (...args: any[]): T;
}

export type GenericClassDecorator<T> = (target: T) => void;

export const Injectable = (): GenericClassDecorator<Type<any>> => {
  return (target) => {};
};

export class DependencyContainer {
  private resolvedClasses = new Map();

  public install(target: Type<any>, instance: any) {
    this.resolvedClasses.set(target, instance);
  }

  private resolve<T>(target: Type<any>, dependencyTree: Type<any>[]): T {
    if (this.resolvedClasses.has(target)) {
      return this.resolvedClasses.get(target);
    }

    if (dependencyTree.includes(target)) {
      throw new Error("=== CIRCULAR DEPENDENCY DETECTED ====");
    }

    dependencyTree.push(target);

    var paramTypes = Reflect.getMetadata("design:paramtypes", target);

    if (paramTypes == null) {
      throw new Error(
        `Type "${target.name}" not found. Did you forget to add @Injectable()?`
      );
    }

    var params = paramTypes.map((p: any) =>
      this.resolve<any>(p, dependencyTree)
    );

    const instance = new target(...params);

    this.resolvedClasses.set(target, instance);
    return instance;
  }

  public get<T>(target: Type<any>): T {
    return this.resolve(target, []);
  }

  public bootstrap(classes: Type<any>[]) {
    classes.forEach((c) => this.get<any>(c));
  }
}
