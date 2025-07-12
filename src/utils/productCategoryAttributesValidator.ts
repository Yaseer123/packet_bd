import { z } from "zod";
import type { CategoryAttribute } from "@/schemas/categorySchema";

/**
 * Creates a Zod schema to validate product's category attributes based on attribute definitions
 */
export function createCategoryAttributesValidator(
  attributeDefinitions: CategoryAttribute[],
) {
  // Create a record schema dynamically based on the attribute definitions
  const schemaEntries = attributeDefinitions.reduce(
    (acc, attr) => {
      let valueSchema: z.ZodType;

      if (attr.type === "select" && attr.options && attr.options.length > 0) {
        // For select types, ensure the value is one of the options
        valueSchema = z.enum(attr.options as [string, ...string[]]);
      } else {
        // For other types, just use string as default
        valueSchema = z.string();
      }

      // If the attribute is required, use the schema directly
      // Otherwise, make it optional
      const finalSchema = attr.required ? valueSchema : valueSchema.optional();

      acc[attr.name] = finalSchema;
      return acc;
    },
    {} as Record<string, z.ZodType>,
  );

  // Create and return the final record schema
  return z.object(schemaEntries);
}
