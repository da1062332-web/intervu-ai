import { Injectable, NotFoundException } from "@nestjs/common";
import { GenerationStrategy } from "@prisma/client";
import { IValidationStrategy } from "../interfaces/validation-strategy.interface";

/**
 * ValidationRegistry
 *
 * Holds a Map<GenerationStrategy, IValidationStrategy>.
 * The controller/service asks the registry for the right validator per strategy —
 * no if/switch anywhere.
 */
@Injectable()
export class ValidationRegistry {
  private readonly validators = new Map<
    GenerationStrategy,
    IValidationStrategy
  >();

  register(key: GenerationStrategy, validator: IValidationStrategy): void {
    this.validators.set(key, validator);
  }

  resolve(key: GenerationStrategy): IValidationStrategy {
    const validator = this.validators.get(key);
    if (!validator) {
      throw new NotFoundException(
        `No validation strategy registered for: ${key}`,
      );
    }
    return validator;
  }

  hasValidator(key: GenerationStrategy): boolean {
    return this.validators.has(key);
  }
}
