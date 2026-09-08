import { BadRequestException, Controller, Get, InternalServerErrorException, NotFoundException, Param, ParseUUIDPipe, Query, UseGuards } from '@nestjs/common';
import { AdminWebSessionGuard } from './admin-web-session.guard';
import { ResponseDraftReadQueryPipe, type ResponseDraftReadQuery } from './response-draft-read-query.pipe';
import { ResponseDraftReadNotFoundError, ResponseDraftReadService } from './response-draft-read.service';

const uuidPipe = () => new ParseUUIDPipe({ version: '4', exceptionFactory: () => new BadRequestException({ statusCode: 400, error: 'Bad Request', message: 'Invalid response draft read request.' }) });

@Controller('admin/businesses/:businessId/response-drafts')
@UseGuards(AdminWebSessionGuard)
export class ResponseDraftReadController {
  constructor(private readonly service: ResponseDraftReadService) {}

  @Get()
  async list(@Param('businessId', uuidPipe()) businessId: string, @Query(ResponseDraftReadQueryPipe) query: ResponseDraftReadQuery) {
    try { return await this.service.list({ businessId, ...query }); }
    catch { throw new InternalServerErrorException({ statusCode: 500, error: 'Internal Server Error', message: 'Unable to read response drafts.' }); }
  }

  @Get(':responseDraftId')
  async detail(@Param('businessId', uuidPipe()) businessId: string, @Param('responseDraftId', uuidPipe()) responseDraftId: string) {
    try { return await this.service.detail(businessId, responseDraftId); }
    catch (error) {
      if (error instanceof ResponseDraftReadNotFoundError) throw new NotFoundException({ statusCode: 404, error: 'Not Found', message: 'Response draft not found.' });
      throw new InternalServerErrorException({ statusCode: 500, error: 'Internal Server Error', message: 'Unable to read response drafts.' });
    }
  }
}
