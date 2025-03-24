/**
 * Converts a string into a FormData object.
 * @param data - Object with keys and values.
 * @returns Constructed FormData.
 */
export function objectToFormData(data: { [key: string]: string }): FormData {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    formData.append(key, value);
  });
  return formData;
}
