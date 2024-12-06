import {
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
  DeleteObjectsCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthService } from 'src/auth/auth.service';
import { User } from 'src/user/entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class FileService {
  private client: S3Client;
  constructor(
    private authService: AuthService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    this.client = new S3Client({
      region: 'eu-west-3',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_KEY,
      },
    });
  }

  async uploadItemImg(files: Array<Express.Multer.File>, itemUid: string) {
    for (const file of files) {
      const command = new PutObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        Key:
          process.env.BUCKET_ITEM_PICTURES_DIRECTORY_NAME +
          '/' +
          itemUid +
          '/' +
          file.originalname,
        Body: file.buffer,
        ContentType: 'image/' + file.originalname.split('.').pop(),
      });

      try {
        await this.client.send(command);
      } catch (err) {
        return err;
      }
    }
  }

  async updateItemImg(
    files: Array<Express.Multer.File>,
    itemUid: string,
    fileNameArray: string[],
  ) {
    const bucketName = process.env.BUCKET_NAME;
    const directoryName = process.env.BUCKET_ITEM_PICTURES_DIRECTORY_NAME;
    const itemDirectory = `${directoryName}/${itemUid}`;

    // Suppression des fichiers spécifiés dans fileNameArray
    for (const fileName of fileNameArray) {
      const deleteParams = {
        Bucket: bucketName,
        Key: `${itemDirectory}/${fileName}`,
      };

      try {
        await this.client.send(new DeleteObjectCommand(deleteParams));
      } catch (error) {
        // Log de l'erreur et continuation, éventuellement une meilleure gestion des erreurs pourrait être nécessaire
        console.error(
          `Erreur lors de la suppression de l'image ${fileName}:`,
          error,
        );
      }
    }

    // Upload des nouveaux fichiers
    for (const file of files) {
      const uploadParams = {
        Bucket: bucketName,
        Key: `${itemDirectory}/${file.originalname}`,
        Body: file.buffer,
        ContentType: `image/${file.originalname.split('.').pop()}`,
      };

      try {
        await this.client.send(new PutObjectCommand(uploadParams));
      } catch (error) {
        // Log de l'erreur et continuation, éventuellement une meilleure gestion des erreurs pourrait être nécessaire
        console.error(
          `Erreur lors du téléchargement de l'image ${file.originalname}:`,
          error,
        );
      }
    }
  }

  // async updateItemImg(
  //   files: Array<Express.Multer.File>,
  //   itemUid: string,
  //   fileNameArray: string[],
  // ) {
  //   //const user = await this.authService.getUserFromRequest(req);

  //   for (const fileName of fileNameArray) {
  //     try {
  //       await this.client.send(
  //         new DeleteObjectCommand({
  //           Bucket: process.env.BUCKET_NAME,
  //           Key:
  //             process.env.BUCKET_ITEM_PICTURES_DIRECTORY_NAME +
  //             '/' +
  //             itemUid +
  //             '/' +
  //             fileName,
  //         }),
  //       );
  //     } catch (error) {
  //       return error;
  //     }
  //   }

  //   for (const file of files) {
  //     const command = new PutObjectCommand({
  //       Bucket: process.env.BUCKET_NAME,
  //       Key:
  //         process.env.BUCKET_ITEM_PICTURES_DIRECTORY_NAME +
  //         '/' +
  //         itemUid +
  //         '/' +
  //         file.originalname,
  //       Body: file.buffer,
  //       ContentType: 'image/' + file.originalname.split('.').pop(),
  //     });
  //     try {
  //       await this.client.send(command);
  //     } catch (err) {
  //       return err;
  //     }
  //   }
  // }

  // async uploadProfilePic(file: Express.Multer.File, req) {
  //   try {
  //     // Récupérer l'utilisateur et lister les objets en parallèle
  //     const user = await this.authService.getUserFromRequest(req);
  //     const list = await this.client.send(
  //       new ListObjectsV2Command({
  //         Bucket: process.env.BUCKET_NAME,
  //         Prefix:
  //           process.env.BUCKET_PFP_DIRECTORY_NAME + '/' + `pfp-${user.id}`,
  //       }),
  //     );

  //     // Si des objets existent, les supprimer
  //     if (list.Contents && list.Contents.length > 0) {
  //       const fileToDelete = list.Contents.map((obj) => ({ Key: obj.Key }));
  //       await this.client.send(
  //         new DeleteObjectsCommand({
  //           Bucket: process.env.BUCKET_NAME,
  //           Delete: { Objects: fileToDelete },
  //         }),
  //       );
  //     }

  //     const timestamp = new Date().getTime();

  //     // Construire et envoyer la commande de téléchargement
  //     const command = new PutObjectCommand({
  //       Bucket: process.env.BUCKET_NAME,
  //       Key: `${process.env.BUCKET_PFP_DIRECTORY_NAME}/pfp-${user.id}/${timestamp}-${file.originalname}`,
  //       Body: file.buffer,
  //       ContentType: 'image/' + file.originalname.split('.').pop(),
  //     });
  //     await this.client.send(command);

  //     // Mettre à jour le nom du fichier dans la base de données
  //     user.pfp_filename = `${timestamp}-${file.originalname}`;

  //     await this.userRepository.save(user);
  //   } catch (err) {
  //     console.error(err);
  //     throw err; // Relancer l'erreur ou gérer selon le besoin
  //   }
  // }

  async uploadProfilePic(file: Express.Multer.File, req) {
    try {
      if (!file) {
        throw new BadRequestException('No file uploaded.');
      }

      const fileType = file.originalname.split('.').pop();
      if (!['jpg', 'jpeg', 'png'].includes(fileType.toLowerCase())) {
        throw new BadRequestException(
          'Invalid file type. Only jpg, jpeg, and png are allowed.',
        );
      }

      // Récupérer l'utilisateur
      const user = await this.authService.getUserFromRequest(req);
      if (!user) {
        throw new BadRequestException('User not found.');
      }

      // Lister les objets existants
      const list = await this.client.send(
        new ListObjectsV2Command({
          Bucket: process.env.BUCKET_NAME,
          Prefix: `${process.env.BUCKET_PFP_DIRECTORY_NAME}/pfp-${user.id}`,
        }),
      );

      // Supprimer les objets existants, le cas échéant
      if (list.Contents && list.Contents.length > 0) {
        const fileToDelete = list.Contents.map((obj) => ({ Key: obj.Key }));
        await this.client.send(
          new DeleteObjectsCommand({
            Bucket: process.env.BUCKET_NAME,
            Delete: { Objects: fileToDelete },
          }),
        );
      }

      const timestamp = new Date().getTime();

      // Construire et envoyer la commande de téléchargement
      const command = new PutObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        Key: `${process.env.BUCKET_PFP_DIRECTORY_NAME}/pfp-${user.id}/${timestamp}-${file.originalname}`,
        Body: file.buffer,
        ContentType: `image/${fileType}`,
      });
      await this.client.send(command);

      // Mettre à jour le nom du fichier dans la base de données
      user.pfp_filename = `${timestamp}-${file.originalname}`;
      await this.userRepository.save(user);
    } catch (err) {
      console.error('Error uploading profile picture:', err);
      if (err instanceof BadRequestException) {
        throw err; // Relancer les erreurs de type BadRequest
      }
      throw new InternalServerErrorException(
        'An error occurred while uploading the profile picture.',
      );
    }
  }

  async deleteItemImg(itemUid: string, fileNameArray: string[]) {
    const bucketName = process.env.BUCKET_NAME;
    const directoryName = process.env.BUCKET_ITEM_PICTURES_DIRECTORY_NAME;
    const itemDirectory = `${directoryName}/${itemUid}`;

    for (const fileName of fileNameArray) {
      const deleteParams = {
        Bucket: bucketName,
        Key: `${itemDirectory}/${fileName}`,
      };

      try {
        await this.client.send(new DeleteObjectCommand(deleteParams));
      } catch (error) {
        console.error(
          `Erreur lors de la suppression de l'image ${fileName}:`,
          error,
        );
      }
    }
  }

  async addItemImages(files: Array<Express.Multer.File>, itemUid: string) {
    const bucketName = process.env.BUCKET_NAME;
    const directoryName = process.env.BUCKET_ITEM_PICTURES_DIRECTORY_NAME;
    const itemDirectory = `${directoryName}/${itemUid}`;

    for (const file of files) {
      const uploadParams = {
        Bucket: bucketName,
        Key: `${itemDirectory}/${file.originalname}`,
        Body: file.buffer,
        ContentType: `image/${file.originalname.split('.').pop()}`,
      };

      try {
        await this.client.send(new PutObjectCommand(uploadParams));
      } catch (error) {
        console.error(
          `Erreur lors du téléchargement de l'image ${file.originalname}:`,
          error,
        );
      }
    }
  }
}
