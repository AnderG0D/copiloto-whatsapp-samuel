import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { decodeCursor } from './response-draft-read.service';

export type ResponseDraftReadQuery = { limit: number; cursor?: { createdAt: string; id: string } };

@Injectable()
export class ResponseDraftReadQueryPipe implements PipeTransform {
  transform(value: unknown): ResponseDraftReadQuery {
    const query = value && typeof value === 'object' ? value as Record<string, unknown> : {};
    if (Object.keys(query).some((key) => key !== 'limit' && key !== 'cursor')) throw invalid();
    const limit = query.limit === undefined ? 25 : Number(query.limit);
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw invalid();
    if (query.cursor !== undefined && (typeof query.cursor !== 'string' || !decodeCursor(query.cursor))) throw invalid();
    return { limit, cursor: typeof query.cursor === 'string' ? decodeCursor(query.cursor) ?? undefined : undefined };
  }
}

function invalid(): BadRequestException {
  return new BadRequestException({ statusCode: 400, error: 'Bad Request', message: 'Invalid response draft read request.' });
}
