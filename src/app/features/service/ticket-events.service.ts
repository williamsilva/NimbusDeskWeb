import { Injectable, NgZone, OnDestroy, inject } from '@angular/core';

import { Subject } from 'rxjs';

import { API } from '@core/api/api.config';

/** Espelha com.nimbusdesk.tickets.core.TicketEventBroadcaster.TicketEvent do NimbusDeskServer -
 *  payload PROPOSITALMENTE mínimo, nada de dado sensível (o evento só avisa "algo mudou", quem
 *  decide o quê mostrar continua sendo os endpoints normais de busca, que já reforçam
 *  visibilidade). */
export interface TicketEventPayload {
  id: string;
  numero: string;
  type: 'created' | 'updated';
}

/**
 * Server-Sent Events - GET /bff/v1/tickets/events (ver TicketEventBroadcaster no backend).
 * Conexão ÚNICA, compartilhada pela sessão inteira do app (providedIn: 'root', aberta sob demanda
 * na primeira vez que alguma tela injeta este serviço e mantida pelo resto da vida do app) - o
 * EventSource nativo do navegador já reconecta sozinho se a conexão cair, sem lógica de retry
 * manual aqui.
 *
 * <p>Objetivo (2026-09-08): telas de listagem/detalhe de Chamados se atualizam sozinhas quando um
 * chamado é criado/modificado (em qualquer aba/sessão, inclusive de outro usuário), sem o usuário
 * precisar clicar em "Atualizar" - ver TicketsListComponent/TicketDetailComponent, que assinam
 * #events$ e disparam um reload "silencioso" dos próprios dados (nunca resetam formulário/diálogo/
 * seleção em andamento - só re-buscam o que já sabiam buscar).
 */
@Injectable({ providedIn: 'root' })
export class TicketEventsService implements OnDestroy {
  private readonly zone = inject(NgZone);
  private eventSource: EventSource | null = null;
  private readonly subject = new Subject<TicketEventPayload>();

  readonly events$ = this.subject.asObservable();

  constructor() {
    this.connect();
  }

  private connect(): void {
    if (this.eventSource) return;

    // Fora da zone: evita disparar change detection à toa a cada heartbeat/reconexão silenciosa -
    // só entra na zone quando um evento de verdade chega (ver #emit).
    this.zone.runOutsideAngular(() => {
      const source = new EventSource(`${API.bff}/v1/tickets/events`, { withCredentials: true });
      this.eventSource = source;

      source.addEventListener('ticket', (ev: MessageEvent<string>) => {
        try {
          const payload = JSON.parse(ev.data) as TicketEventPayload;
          this.zone.run(() => this.subject.next(payload));
        } catch {
          // payload inesperado - ignora, não derruba a conexão.
        }
      });

      // Sem handler custom de erro/close: o EventSource nativo já reconecta sozinho (retry
      // automático do navegador) - só existe pro TypeScript não reclamar de erro não observado.
      source.onerror = () => undefined;
    });
  }

  ngOnDestroy(): void {
    this.eventSource?.close();
    this.eventSource = null;
  }
}
