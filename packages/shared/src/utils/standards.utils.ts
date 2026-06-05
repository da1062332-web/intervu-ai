/**
 * Utilities for enforcing engineering standards in CI/CD or runtime checks.
 */

export function validateDtoNaming(name: string): boolean {
  return (
    name.endsWith("RequestDto") ||
    name.endsWith("ResponseDto") ||
    name.endsWith("Dto")
  );
}

export function validateFolderConvention(path: string): boolean {
  const allowedFolders = [
    "controllers",
    "services",
    "repositories",
    "dto",
    "validators",
  ];
  return allowedFolders.some(
    (folder) => path.includes(`/${folder}/`) || path.includes(`\\${folder}\\`),
  );
}
