import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Put,
  Req,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  InternalServerErrorException,
  Query,
  Post,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/user.dto';
import { Roles } from 'src/auth/roles.decorator';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { User } from './entities/user.entity';
import { CreateReviewDto } from './dto/review.dto';
@ApiTags('user')
@ApiBearerAuth('access-token')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Get(':id')
  @Roles(['ADMIN', 'USER'])
  @ApiOperation({
    description: "Données d'un utilisateur",
  })
  findOne(@Param('id') id: string, @Req() request: Request): Promise<User> {
    return this.userService.findOne(+id, request);
  }

  @Get()
  @Roles(['ADMIN'])
  @ApiOperation({
    description:
      'Lister les données de tous les utilisateurs (Administrateur uniquement)',
  })
  findAll(): Promise<User[]> {
    return this.userService.findAll();
  }

  @Put(':id')
  @Roles(['ADMIN', 'USER'])
  @ApiOperation({
    description: "Modifier des données d'un utilisateur",
  })
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }),
  ) // Par exemple, limite de 10 Mo
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @UploadedFile() file: Express.Multer.File,
    @Req() request: Request,
  ): Promise<User> {
    try {
      // Validation basique
      if (!updateUserDto) {
        throw new BadRequestException('No update data provided.');
      }

      // Ici, vous pouvez maintenant accéder au fichier téléchargé via `file`
      return await this.userService.update(
        +id,
        updateUserDto,
        file || null,
        request,
      );
    } catch (error) {
      console.error('Controller Error:', error);
      throw new InternalServerErrorException(
        'An error occurred while updating the user.',
      );
    }
  }
  // L'ancienne méthode de mise à jour sans fichier
  // update(
  //   @Param('id') id: string,
  //   @Body() updateUserDto: UpdateUserDto,
  //   @Req() request: Request,
  // ): Promise<User> {
  //   return this.userService.update(+id, updateUserDto, request);
  // }
  @Put(':id/password')
  @Roles(['ADMIN', 'USER'])
  @ApiOperation({
    description: "Modifier le mot de passe d'un utilisateur",
  })
  updatePassword(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Req() request: Request,
  ): Promise<User> {
    return this.userService.updatePassword(+id, updateUserDto, request);
  }

  @Delete(':id')
  @Roles(['ADMIN', 'USER'])
  @ApiOperation({
    description: 'Supprimer un utilisateur',
  })
  remove(@Param('id') id: string, @Req() request: Request): Promise<User> {
    return this.userService.remove(+id, request);
  }

  @Put(':id/upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    console.log(file);
  }

  @Post(':id/review')
  rateUser(@Param('id') id: string, @Body() createReviewDto: CreateReviewDto) {
    return this.userService.rateUser(+id, createReviewDto);
  }

  @Get(':id/review')
  findUserReviews(@Param('id') id: string) {
    return this.userService.findUserReviews(+id);
  }

  @Get(':id/stats')
  @Roles(['ADMIN', 'USER'])
  @ApiOperation({
    description: 'Obtenir les statistiques des reviews pour un utilisateur',
  })
  async getUserReviewStats(@Param('id') id: string) {
    return await this.userService.getUserReviewStats(+id);
  }

  @Get(':id/paginatedReviews')
  @Roles(['ADMIN', 'USER'])
  @ApiOperation({
    description: 'Obtenir les reviews paginés pour un utilisateur',
  })
  async getUserPaginatedReviews(
    @Param('id') id: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return await this.userService.getUserReviews(+id, page, limit);
  }
}
