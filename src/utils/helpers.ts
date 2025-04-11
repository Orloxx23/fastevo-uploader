/**
 * Converts an object to a FormData instance.
 * @param data - An object with key-value pairs.
 * @returns The constructed FormData.
 * @throws {TypeError} If the input is not a valid object.
 */
export function objectToFormData(data: { [key: string]: string }): FormData {
  if (typeof data !== "object" || data === null) {
    throw new TypeError("Input data must be a non-null object.");
  }

  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    formData.append(key, value);
  });
  return formData;
}
