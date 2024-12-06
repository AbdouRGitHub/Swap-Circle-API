import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthService } from 'src/auth/auth.service';
import { In, Like, Not, Repository } from 'typeorm';
import { Item, Scope } from './entities/item.entity';
import { FileService } from 'src/file/file.service';
import { CreateItemDto, UpdateItemDto } from './dto/item.dto';
import { SearchItemDto } from './dto/search.dto';
import { SearchPaginatedItemDto } from './dto/search-paginated.dto';
import { FriendService } from 'src/friend/friend.service';

@Injectable()
export class ItemService {
  constructor(
    private authService: AuthService,
    private fileService: FileService,
    private friendService: FriendService,
    @InjectRepository(Item)
    private itemRepository: Repository<Item>,
  ) {}

  async create(
    createItemDto: CreateItemDto,
    files: Array<Express.Multer.File>,
    req,
  ) {
    const user = await this.authService.getUserFromRequest(req);
    const fileNameArray = JSON.stringify(
      files.map((file) => file.originalname),
    );
    let item = this.itemRepository.create({
      ...createItemDto,
      owner: user,
      imgPath: fileNameArray,
    });

    item.available = item.available ? 'true' : 'false';

    item = await this.itemRepository.save(item);
    await this.fileService.uploadItemImg(files, item.uid);
    return item;
  }

  async findOne(itemUid: string, request) {
    const item = await this.itemRepository.findOne({
      where: {
        uid: itemUid,
      },
      relations: ['owner'], // Charger seulement le propriétaire, pas les reviews
    });

    if (!item) {
      throw new NotFoundException(`Item #${itemUid} not found`);
    }

    // Calculer la moyenne des notes via une requête directe à la base de données
    const { averageRating, reviewCount } = await this.itemRepository
      .createQueryBuilder('item')
      .leftJoin('item.owner', 'owner')
      .leftJoin('owner.receivedReviews', 'reviews')
      .where('item.uid = :itemUid', { itemUid })
      .select('AVG(reviews.rating)', 'averageRating') // Sélectionner la moyenne des notes
      .addSelect('COUNT(reviews.id)', 'reviewCount') // Sélectionner le nombre total de reviews
      .getRawOne();

    // Retourner l'item avec la moyenne des notes
    return {
      ...item,
      owner: {
        ...item.owner,
        averageRating: parseFloat(averageRating) || 0, // Assurer que la moyenne est un nombre
        reviewCount: parseInt(reviewCount, 10) || 0, // Assurer que le nombre de reviews est un nombre entier
      },
    };
  }

  async findAll(request) {
    const user = await this.authService.getUserFromRequest(request);

    if (user.role == 'ADMIN') {
      return await this.itemRepository.find();
    }

    return await this.itemRepository.find({
      where: {
        owner: {
          id: user.id,
        },
      },
      relations: ['owner'],
    });
  }

  async update(
    itemUid: string,
    files: Array<Express.Multer.File>,
    updateItemDto: UpdateItemDto,
    request,
  ) {
    const newImgPath: string[] = [];
    const user = await this.authService.getUserFromRequest(request);

    const item = await this.itemRepository.preload({
      uid: itemUid,
      ...updateItemDto,
    });

    if (!item) {
      throw new NotFoundException('Item not found');
    }

    // Check for existing images
    const existingFileNames = JSON.parse(item.imgPath || '[]');
    const newFileNames = files.map((file) => file.originalname);
    const filesToDelete = existingFileNames.filter(
      (fileName) => !newFileNames.includes(fileName),
    );
    const filesToAdd = files.filter(
      (file) => !existingFileNames.includes(file.originalname),
    );

    // Delete old images
    if (filesToDelete.length > 0) {
      await this.fileService.deleteItemImg(item.uid, filesToDelete);
    }

    // Add new images
    if (filesToAdd.length > 0) {
      await this.fileService.addItemImages(filesToAdd, item.uid);
    }

    // Update item properties
    const updatedFileNameArray = JSON.stringify([
      ...existingFileNames.filter((fileName) =>
        newFileNames.includes(fileName),
      ),
      ...newFileNames.filter(
        (fileName) => !existingFileNames.includes(fileName),
      ),
    ]);

    const updatedItem = Object.assign(item, updateItemDto, {
      imgPath: updatedFileNameArray,
    });

    await this.itemRepository.save(updatedItem);

    return updatedItem;
  }
  catch(error) {
    // Handle errors appropriately
    throw new Error(`Failed to update item: ${error.message}`);
  }

  // async update(
  //   itemUid: string,
  //   files: Array<Express.Multer.File>,
  //   updateItemDto: UpdateItemDto,
  //   request,
  // ) {
  //   // Obtenez l'utilisateur si nécessaire
  //   // const user = await this.authService.getUserFromRequest(request);

  //   const item = await this.itemRepository.preload({
  //     uid: itemUid,
  //     ...updateItemDto,
  //   });

  //   if (!item) {
  //     throw new NotFoundException(`Article #${itemUid} non trouvé`);
  //   }

  //   let fileNameArray: string[] = [];
  //   if (updateItemDto.fileNameArray) {
  //     try {
  //       fileNameArray = JSON.parse(
  //         updateItemDto.fileNameArray.replace(/'/g, '"'),
  //       );
  //     } catch (err) {
  //       throw new BadRequestException('Format de fileNameArray invalide');
  //     }
  //   }

  //   try {
  //     await this.fileService.updateItemImg(files, itemUid, fileNameArray);

  //     const currentImgPath: string[] = item.imgPath
  //       ? JSON.parse(item.imgPath.replace(/'/g, '"'))
  //       : [];

  //     // Créer un nouveau tableau d'images en supprimant celles à supprimer et en ajoutant les nouvelles
  //     const newImgPath = [
  //       ...currentImgPath.filter((img) => !fileNameArray.includes(img)),
  //       ...files.map((file) => file.originalname),
  //     ];

  //     item.imgPath = JSON.stringify(newImgPath);

  //     return await this.itemRepository.save(item);
  //   } catch (err) {
  //     throw new InternalServerErrorException(
  //       `Échec de la mise à jour de l'article : ${err.message}`,
  //     );
  //   }
  // }

  // async update(
  //   itemUid: string,
  //   files: Array<Express.Multer.File>,
  //   updateItemDto: UpdateItemDto,
  //   request,
  // ) {
  //   let newImgPath: string[] = [];
  //   //const user = await this.authService.getUserFromRequest(request);

  //   const item = await this.itemRepository.preload({
  //     uid: itemUid,
  //     ...updateItemDto,
  //   });

  //   if (!item) {
  //     throw new NotFoundException(`Item #${itemUid} not found`);
  //   }

  //   let fileNameArray: string[] = JSON.parse(
  //     updateItemDto.fileNameArray.replace(/'/g, '"'),
  //   );

  //   try {
  //     await this.fileService.updateItemImg(files, itemUid, fileNameArray);
  //     if (item.imgPath) {
  //       let oldImgPath: string[] = JSON.parse(item.imgPath.replace(/'/g, '"'));
  //       newImgPath = oldImgPath.filter((img) => !fileNameArray.includes(img));
  //       for (let file of files) {
  //         newImgPath.push(file.originalname);
  //       }
  //       item.imgPath = JSON.stringify(newImgPath);
  //     } else {
  //       for (let file of files) {
  //         newImgPath.push(file.originalname);
  //       }
  //       item.imgPath = JSON.stringify(newImgPath);
  //     }
  //     //nouveau nom de fichier ajouté
  //     return await this.itemRepository.save(item);
  //   } catch (err) {
  //     throw Error(err.message);
  //   }
  // }

  async remove(itemUid: string, request) {
    const user = await this.authService.getUserFromRequest(request);

    const item = await this.itemRepository.findOne({
      where: {
        uid: itemUid,
      },
      relations: ['owner'],
    });

    if (!item) {
      throw new NotFoundException(`Item #${itemUid} not found`);
    }

    if (user.id != item.owner.id && user.role != 'ADMIN') {
      throw new UnauthorizedException('You are not the owner of this item');
    }

    return await this.itemRepository.remove(item);
  }

  async isAvailable(itemUid: string, request) {
    const user = await this.authService.getUserFromRequest(request);

    const item = await this.itemRepository.findOne({
      where: {
        uid: itemUid,
      },
      relations: ['owner'],
    });

    if (!item) {
      throw new NotFoundException(`Item #${itemUid} not found`);
    }

    if (user.id != item.owner.id && user.role != 'ADMIN') {
      throw new UnauthorizedException('You are not the owner of this item');
    }

    item.available = 'true';

    return await this.itemRepository.save(item);
  }

  async isUnAvailable(itemUid: string, request) {
    const user = await this.authService.getUserFromRequest(request);

    const item = await this.itemRepository.findOne({
      where: {
        uid: itemUid,
      },
      relations: ['owner'],
    });

    if (!item) {
      throw new NotFoundException(`Item #${itemUid} not found`);
    }

    if (user.id != item.owner.id && user.role != 'ADMIN') {
      throw new UnauthorizedException('You are not the owner of this item');
    }

    item.available = 'false';

    return await this.itemRepository.save(item);
  }

  async search(searchItemDto: SearchItemDto, request) {
    const searchField = searchItemDto.searchField.replaceAll(' ', '%');

    const user = await this.authService.getUserFromRequest(request);

    if (!user) {
      throw new NotFoundException(`User #${user.id} not found`);
    }

    if (searchItemDto.scope === Scope.PUBLIC) {
      const item = await this.itemRepository.find({
        where: {
          available: 'true',
          name: Like(`%${searchField}%`),
          owner: {
            id: Not(user.id),
          },
          scope: Scope.PUBLIC,
        },
        relations: ['owner'],
      });

      if (!item) {
        throw new NotFoundException(`Item(s) list is empty`);
      }

      return await item;
    } else {
      const friends = await this.friendService.friendList(request);

      const item = await this.itemRepository.find({
        where: {
          available: 'true',
          scope: Scope.PRIVATE,
          name: Like(`%${searchField}%`),
          owner: {
            id: In(friends.map((friend) => friend.id)),
          },
        },
        relations: ['owner'],
      });

      if (!item) {
        throw new NotFoundException(`Item(s) list is empty`);
      }

      return await item;
    }
  }

  async findByUser(request) {
    const user = await this.authService.getUserFromRequest(request);

    if (!user) {
      throw new NotFoundException(`User #${user.id} not found`);
    }

    return await this.itemRepository.find({
      where: {
        owner: {
          id: user.id,
        },
      },
      relations: ['owner'],
      order: {
        createdAt: 'DESC', // Assuming you have a 'createdAt' column to sort by
      },
    });
  }

  async findAllPaginated(
    page: number,
    limit: number,
    scope: string,
    request: Request,
  ) {
    if (scope === Scope.PUBLIC) {
      // Articles publics
      const [result, total] = await this.itemRepository.findAndCount({
        where: {
          available: 'true',
          scope: Scope.PUBLIC, // Inclure uniquement les articles publics
        },
        relations: ['owner'],
        order: { createdAt: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
      });

      return {
        data: result,
        total,
        page,
        lastPage: Math.ceil(total / limit),
      };
    }

    if (scope === Scope.PRIVATE) {
      // Récupération des amis
      const user = await this.authService.getUserFromRequest(request);
      if (!user) {
        throw new NotFoundException('Utilisateur non trouvé');
      }

      const friends = await this.friendService.friendList(request);
      if (!friends || friends.length === 0) {
        return {
          data: [],
          total: 0,
          page,
          lastPage: 0,
        };
      }

      const friendIds = friends.map((friend) => friend.id);

      // Articles privés des amis uniquement
      const [result, total] = await this.itemRepository.findAndCount({
        where: {
          available: 'true',
          scope: Scope.PRIVATE, // Inclure uniquement les articles privés
          owner: {
            id: In(friendIds), // Articles des amis uniquement
          },
        },
        relations: ['owner'],
        order: { createdAt: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
      });

      return {
        data: result,
        total,
        page,
        lastPage: Math.ceil(total / limit),
      };
    }
  }

  async searchPaginated(searchDto: SearchPaginatedItemDto, request) {
    const { searchField, page, limit, scope } = searchDto;

    const user = await this.authService.getUserFromRequest(request);

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    if (scope === Scope.PUBLIC) {
      // Gestion des articles publics
      const query = this.itemRepository
        .createQueryBuilder('item')
        .leftJoinAndSelect('item.owner', 'owner')
        .where('item.scope != :privateScope', { privateScope: Scope.PRIVATE }); // Exclure les articles privés

      if (searchField) {
        query.andWhere(
          '(item.name LIKE :searchField OR owner.username LIKE :searchField)',
          {
            searchField: `%${searchField}%`,
          },
        );
      }

      query
        .andWhere('item.available = :available', { available: 'true' })
        .orderBy('item.createdAt', 'DESC')
        .skip((page - 1) * limit)
        .take(limit);

      const [result, total] = await query.getManyAndCount();

      return {
        data: result,
        total,
        page,
        lastPage: Math.ceil(total / limit),
      };
    }

    if (scope === Scope.PRIVATE) {
      // Récupération des amis
      const friends = await this.friendService.friendList(request);

      if (!friends || friends.length === 0) {
        return {
          data: [],
          total: 0,
          page,
          lastPage: 0,
        };
      }

      const friendIds = friends.map((friend) => friend.id);

      // Gestion des articles privés
      const query = this.itemRepository
        .createQueryBuilder('item')
        .leftJoinAndSelect('item.owner', 'owner')
        .where('item.scope = :scope', { scope: Scope.PRIVATE }) // Articles privés uniquement
        .andWhere('item.available = :available', { available: 'true' })
        .andWhere('owner.id IN (:...friendIds)', { friendIds }); // Articles des amis uniquement

      if (searchField) {
        // Appliquer la recherche aux articles des amis
        query.andWhere(
          '(item.name LIKE :searchField OR owner.username LIKE :searchField)',
          {
            searchField: `%${searchField}%`,
          },
        );
      }

      query
        .orderBy('item.createdAt', 'DESC')
        .skip((page - 1) * limit)
        .take(limit);

      const [result, total] = await query.getManyAndCount();
      return {
        data: result,
        total,
        page,
        lastPage: Math.ceil(total / limit),
      };
    }
  }
}
