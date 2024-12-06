import { FileValidator } from '@nestjs/common';

export class ItemSizeValidator extends FileValidator {
  constructor() {
    super({});
  }

  isValid(file?: Express.Multer.File): boolean | Promise<boolean> {
    // 10 Mo = 10 * 1024 * 1024 = 10 485 760 octets
    if (file?.size > 10 * 1024 * 1024) {
      return false;
    }
    return true;
  }
  
  buildErrorMessage(file?: Express.Multer.File): string {
    return 'Taille maximale atteinte (10 Mo maximum)';
  }
}
