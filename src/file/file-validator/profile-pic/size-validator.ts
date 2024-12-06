import { FileValidator, HttpException, HttpStatus } from "@nestjs/common";

export class ProfilePicSizeValidator extends FileValidator {
  constructor() { super({}); }

  /**
 * Indicates if this file should be considered valid, according to the options passed in the constructor.
 * @param file the file from the request object
 */
  isValid(file?: Express.Multer.File): boolean | Promise<boolean> {
    if (file.size > 2000000) {
      return false;
    }
    return true;
  }
  /**
   * Builds an error message in case the validation fails.
   * @param file the file from the request object
   */
  buildErrorMessage(file: Express.Multer.File): string {
    return 'Taille maximale atteinte (2 Mo maximum)';
  }
}
