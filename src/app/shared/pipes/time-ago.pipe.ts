import { DestroyRef, Pipe, PipeTransform, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { TranslateService } from '@ngx-translate/core';

/**
 * Tempo relativo ("2 meses atrás", "8 horas atrás") - primeiro uso desse recurso no ecossistema
 * Nimbus (não existia pipe de tempo relativo em nenhum outro produto, nem na lib compartilhada).
 * Reaproveita as chaves {@code common.timeAgo.*} (ICU MessageFormat plural - "Um mês atrás" pro
 * singular, "# meses atrás" pro plural - via TranslateMessageFormatCompiler, já configurado em
 * app.config.ts pro filtro "N ativos"). {@code pure: false} (mesmo padrão de CsDatePipe) - reage a
 * troca de idioma em runtime.
 */
@Pipe({
  name: 'timeAgo',
  standalone: true,
  pure: false,
})
export class TimeAgoPipe implements PipeTransform {
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly tick = signal(0);

  constructor() {
    this.translate.onLangChange.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.tick.update((v) => v + 1);
    });
  }

  transform(value: string | Date | number | null | undefined): string {
    this.tick();

    if (value == null || value === '') {
      return '-';
    }

    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '-';
    }

    // Clamp em 0 - relógio do cliente ligeiramente adiantado em relação ao servidor não deve virar
    // "daqui a X", só "agora mesmo".
    const diffSeconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));

    if (diffSeconds < 60) {
      return this.translate.instant('common.timeAgo.justNow');
    }

    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) {
      return this.translate.instant('common.timeAgo.minutes', { count: diffMinutes });
    }

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) {
      return this.translate.instant('common.timeAgo.hours', { count: diffHours });
    }

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) {
      return this.translate.instant('common.timeAgo.days', { count: diffDays });
    }

    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) {
      return this.translate.instant('common.timeAgo.months', { count: diffMonths });
    }

    const diffYears = Math.floor(diffMonths / 12);
    return this.translate.instant('common.timeAgo.years', { count: diffYears });
  }
}
