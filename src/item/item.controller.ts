import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseFilePipe,
  Post,
  Put,
  Req,
  UploadedFiles,
  UseInterceptors,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from 'src/auth/roles.decorator';
import { ItemService } from './item.service';
import { CreateItemDto, UpdateItemDto } from './dto/item.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ItemSizeValidator } from 'src/file/file-validator/item-pic/size-validator';
import { ItemMimeTypeValidator } from 'src/file/file-validator/item-pic/mimetype-validator';
import { SearchItemDto } from './dto/search.dto';
import { SearchPaginatedItemDto } from './dto/search-paginated.dto';

@ApiTags('item')
@ApiBearerAuth('access-token')
@Controller('item')
export class ItemController {
  constructor(private itemService: ItemService) {}

  @Post()
  //@Roles(['ADMIN', 'USER'])
  @ApiOperation({
    description: 'Créer un article',
  })
  @UseInterceptors(FilesInterceptor('files', 4))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: CreateItemDto,
  })
  create(
    @Body() createItemDto: CreateItemDto,
    @UploadedFiles(
      new ParseFilePipe({
        validators: [new ItemSizeValidator(), new ItemMimeTypeValidator()],
        fileIsRequired: false,
      }),
    )
    files: Array<Express.Multer.File>,
    @Req()
    request: Request,
  ) {
    return this.itemService.create(createItemDto, files, request);
  }

  @Get(':id')
  @ApiOperation({
    description: "Info d'un article",
  })
  findOne(@Param('id') id: string, @Req() request: Request) {
    return this.itemService.findOne(id, request);
  }

  @Get()
  @ApiOperation({
    description: 'Lister les articles objet (Tous les articles si ADMIN)',
  })
  findAll(@Req() request: Request) {
    return this.itemService.findAll(request);
  }

  @Put(':id')
  //@Roles(['ADMIN', 'USER'])
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    description: 'Modifier un article',
  })
  @ApiBody({
    type: UpdateItemDto,
  })
  @UseInterceptors(FilesInterceptor('files', 4))
  update(
    @Param('id') id: string,
    @UploadedFiles(
      new ParseFilePipe({
        validators: [new ItemSizeValidator(), new ItemMimeTypeValidator()],
        fileIsRequired: false,
      }),
    )
    files: Array<Express.Multer.File>,
    @Body() updateItemDto: UpdateItemDto,
    @Req()
    request: Request,
  ) {
    return this.itemService.update(id, files, updateItemDto, request);
  }

  @Delete(':id')
  @Roles(['ADMIN', 'USER'])
  @ApiOperation({
    description: 'Supprimer un article',
  })
  remove(@Param('id') id: string, @Req() request: Request) {
    return this.itemService.remove(id, request);
  }

  @Post('search')
  @ApiOperation({
    description: 'Rechercher les articles disponible',
  })
  search(@Body() searchItemDto: SearchItemDto, @Req() request: Request) {
    return this.itemService.search(searchItemDto, request);
  }

  @Put(':id/available')
  //@Roles(['ADMIN', 'USER'])
  @ApiOperation({
    description: "Rend l'article disponible aux prêts",
  })
  isAvailable(@Param('id') id: string, @Req() request: Request) {
    return this.itemService.isAvailable(id, request);
  }

  @Put(':id/unavailable')
  @Roles(['ADMIN', 'USER'])
  @ApiOperation({
    description: "Rend l'article indisponible aux prêts",
  })
  isUnAvailable(@Param('id') id: string, @Req() request: Request) {
    return this.itemService.isUnAvailable(id, request);
  }

  // New method to get items by user
  @Get('user/items')
  @ApiOperation({
    description: "Lister tous les articles d'un utilisateur",
  })
  findByUser(@Req() request: Request) {
    return this.itemService.findByUser(request);
  }

  @Get('paginated/items')
  @ApiOperation({
    description: 'Lister les articles avec pagination',
  })
  async findAllPaginated(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('scope') scope: string, // Paramètre scope ajouté
    @Req() request: Request, // Récupérer les informations de l'utilisateur
  ) {
    const pageNumber = Number(page) || 1;
    const limitNumber = Number(limit) || 10;
    const scopeValue = scope || 'public'; // Valeur par défaut : public

    return this.itemService.findAllPaginated(
      pageNumber,
      limitNumber,
      scopeValue,
      request,
    );
  }

  @Post('search-paginated/items')
  @ApiOperation({
    description: 'Rechercher les articles disponibles avec pagination',
  })
  @ApiBody({ type: SearchPaginatedItemDto }) // Ajout du décorateur ApiBody pour spécifier les champs du corps de la requête
  async searchPaginated(
    @Body() searchPaginatedItemDto: SearchPaginatedItemDto,
    @Req() request: Request,
  ) {
    return this.itemService.searchPaginated(searchPaginatedItemDto, request);
  }
}
