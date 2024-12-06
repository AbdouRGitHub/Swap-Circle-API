import { FileValidator } from '@nestjs/common';

export class ItemMimeTypeValidator extends FileValidator {
  constructor() {
    super({});
  }

  isValid(file?: Express.Multer.File): boolean | Promise<boolean> {
      if (!file.mimetype.match(/\/(jpg|png|jpeg)$/)) {
        return false;
      }
    return true;
  }

  buildErrorMessage(file?: Express.Multer.File): string {
    return 'Format de fichier non accepté (jpg, jpeg ou png uniquement)';
  }
}
