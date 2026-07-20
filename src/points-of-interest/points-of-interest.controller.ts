import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { PointsOfInterestService } from './points-of-interest.service';
import { CreatePointsOfInterestDto } from './dto/create-points-of-interest.dto';
import { UpdatePointsOfInterestDto } from './dto/update-points-of-interest.dto';

@Controller('points-of-interest')
export class PointsOfInterestController {
  constructor(
    private readonly pointsOfInterestService: PointsOfInterestService,
  ) {}

  @Post()
  create(@Body() createPointsOfInterestDto: CreatePointsOfInterestDto) {
    return this.pointsOfInterestService.create(createPointsOfInterestDto);
  }

  @Get()
  findAll() {
    return this.pointsOfInterestService.findAll();
  }

  @Get('n-plus-one')
  findAllWithNPlusOne() {
    return this.pointsOfInterestService.findAllWithNPlusOne();
  }

  @Get('optimized')
  findAllOptimized() {
    return this.pointsOfInterestService.findAllOptimized();
  }

  @Get('cached')
  findAllCached() {
    return this.pointsOfInterestService.findAllCached();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.pointsOfInterestService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePointsOfInterestDto: UpdatePointsOfInterestDto,
  ) {
    return this.pointsOfInterestService.update(
      id,
      updatePointsOfInterestDto,
    );
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.pointsOfInterestService.remove(id);
  }
}
