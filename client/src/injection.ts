import "reflect-metadata";

// TODO: Figure out how to replace any with unknown here.
interface Type<T> {
  new (...args: any[]): T;
}
type GenericClassDecorator<T> = (target: T) => void;

export const Injectable = (): GenericClassDecorator<Type<unknown>> => {
  return (_) => {};
};

/**
 * The @type {DependencyContainer} class can be used for dependency
 * injection and inversion of control.
 *
 * Bootstrapping creates instances of each class and it's dependencies
 * automagically.
 */
export class DependencyContainer {
  private resolvedClasses = new Map();

  /**
   * This method allows for manual installation of a dependency.
   * This can be useful in cases where a dependency is required by
   * other classes can not be created automatically itself.
   *
   * @param target The type that should be resolvable
   * @param instance The concrete instance that will be resolved
   */
  public install(target: Type<unknown>, instance: unknown) {
    this.resolvedClasses.set(target, instance);
  }

  /**
   * Returns the resolved instance of a target type.
   *
   * @example
   *
   *  let service = get<IServiceName>(IServiceName);
   *
   * @param target The target type that should be resolved
   */
  public get<T>(target: Type<unknown>): T {
    return this.resolve(target, []);
  }

  /**
   * Bootstraps all classes handed in to this method.
   * This guarantees the creation of each class and it's
   * dependencies.
   *
   * @param classes An array of the classes to create
   */
  public bootstrap(classes: Type<unknown>[]) {
    classes.forEach((c) => this.get<unknown>(c));
  }

  private resolve<T>(
    target: Type<unknown>,
    dependencyTree: Type<unknown>[]
  ): T {
    if (this.resolvedClasses.has(target)) {
      return this.resolvedClasses.get(target);
    }

    if (dependencyTree.includes(target)) {
      throw new Error(
        `DependencyContainer has detected a circular dependency with '${target}' class involved.`
      );
    }

    dependencyTree.push(target);

    const paramTypes = Reflect.getMetadata("design:paramtypes", target);

    if (paramTypes == null) {
      throw new Error(
        `Type "${target.name}" not found. Did you forget to add @Injectable() or declare a constructor?`
      );
    }

    const params = paramTypes.map((p: Type<unknown>) =>
      this.resolve<unknown>(p, dependencyTree)
    );

    const instance = new target(...params);

    this.resolvedClasses.set(target, instance);
    return instance as T;
  }
}
