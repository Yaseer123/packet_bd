import type { CategoryAttribute } from "@/schemas/categorySchema";

/**
 * Validates that a product's categoryAttributes satisfy the category's required attributes
 * @param categoryAttributes The product's category attribute values
 * @param categoryAttributeDefinitions The category's attribute definitions
 * @returns An object with isValid and any error messages
 */
export function validateCategoryAttributes(
  categoryAttributes: Record<string, string | number | boolean>,
  categoryAttributeDefinitions: CategoryAttribute[],
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check that all required attributes are present and valid
  for (const attrDef of categoryAttributeDefinitions) {
    if (attrDef.required) {
      const value = categoryAttributes[attrDef.name];

      // Check if the attribute exists
      if (value === undefined || value === null || value === "") {
        errors.push(`Required attribute "${attrDef.name}" is missing`);
        continue;
      }

      // For select type, validate that the value is one of the options
      if (attrDef.type === "select" && attrDef.options) {
        if (!attrDef.options.includes(value.toString())) {
          errors.push(
            `Value "${value}" for attribute "${attrDef.name}" is not among the valid options: ${attrDef.options.join(", ")}`,
          );
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
