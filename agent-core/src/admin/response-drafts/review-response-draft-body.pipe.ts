import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

export type ReviewResponseDraftBody =
  | {
      decision: 'APPROVE' | 'REJECT';
      finalText?: never;
    }
  | {
      decision: 'EDIT_AND_APPROVE';
      finalText: string;
    };

@Injectable()
export class ReviewResponseDraftBodyPipe implements PipeTransform<
  unknown,
  ReviewResponseDraftBody
> {
  transform(value: unknown): ReviewResponseDraftBody {
    if (!this.isPlainObject(value)) {
      throw this.invalidRequest();
    }

    const keys = Object.keys(value);

    if (
      keys.some((key) => key !== 'decision' && key !== 'finalText') ||
      !Object.hasOwn(value, 'decision')
    ) {
      throw this.invalidRequest();
    }

    const decision = value.decision;
    const hasFinalText = Object.hasOwn(value, 'finalText');

    if (decision === 'EDIT_AND_APPROVE') {
      if (
        !hasFinalText ||
        typeof value.finalText !== 'string' ||
        !value.finalText.trim()
      ) {
        throw this.invalidRequest();
      }

      return {
        decision,
        finalText: value.finalText,
      };
    }

    if ((decision === 'APPROVE' || decision === 'REJECT') && !hasFinalText) {
      return { decision };
    }

    throw this.invalidRequest();
  }

  private isPlainObject(value: unknown): value is Record<string, unknown> {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return false;
    }

    const prototype = Object.getPrototypeOf(value) as object | null;

    return prototype === Object.prototype || prototype === null;
  }

  private invalidRequest(): BadRequestException {
    return new BadRequestException({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Invalid response draft review request.',
    });
  }
}
