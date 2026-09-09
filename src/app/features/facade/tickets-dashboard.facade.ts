import { Injectable, inject, signal } from '@angular/core';

import { finalize } from 'rxjs';

import { TicketsApiService } from '@features/service/tickets.api.service';
import { TicketDashboardModel } from '@models/ticket-dashboard.models';

/** Dashboard do módulo de Chamados - facade separado de TicketsFacade (mesmo espírito de
 *  DashboardFacade x WorksFacade no NimbusFlow: concern próprio, mesmo consumindo o mesmo
 *  TicketsApiService). Só chamado se o usuário tiver CHAMADO_CONSULT (ver DashboardComponent). */
@Injectable({ providedIn: 'root' })
export class TicketsDashboardFacade {
  private readonly api = inject(TicketsApiService);

  private readonly _loading = signal(false);
  private readonly _loadedOnce = signal(false);
  private readonly _data = signal<TicketDashboardModel | null>(null);

  readonly loading = this._loading.asReadonly();
  readonly data = this._data.asReadonly();
  readonly loadedOnce = this._loadedOnce.asReadonly();

  load(): void {
    if (this._loading()) return;
    this._loading.set(true);

    this.api
      .getDashboard()
      .pipe(
        finalize(() => {
          this._loading.set(false);
          this._loadedOnce.set(true);
        }),
      )
      .subscribe({
        next: (data) => this._data.set(data),
        error: () => this._data.set(null),
      });
  }
}
