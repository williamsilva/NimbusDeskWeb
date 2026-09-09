import { Router } from '@angular/router';
import { ChartModule } from 'primeng/chart';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TranslateModule } from '@ngx-translate/core';
import { Component, OnInit, computed, inject } from '@angular/core';

import { ThemeService } from '@williamsilva/nimbus-web-commons';
import { I18nService } from '@core/i18n/i18n.service';
import { CsDatePipe } from '@shared/pipes/cs-date.pipe';
import { TicketsDashboardFacade } from '@features/facade/tickets-dashboard.facade';
import { PageHeaderComponent } from '@shared/features/page-header/page-header.component';
import { TicketsPermissionPolicy } from '@features/tickets/tickets-permission.policy';
import { StatusBadgeComponent } from '@shared/features/status-badge/status-badge.component';
import { TicketStatusEnum, ticketStatusTone } from '@models/enums/ticket-status.enum';

/** Mesmas cores do status-badge (status-badge.component.scss) - um status tem sempre a mesma cor
 *  em toda a tela (ver TicketsListComponent/ticket-detail). */
const STATUS_COLORS: Record<TicketStatusEnum, string> = {
  [TicketStatusEnum.ABERTO]: '#3b82f6',
  [TicketStatusEnum.EM_ANDAMENTO]: '#f59e0b',
  [TicketStatusEnum.AGUARDANDO_SOLICITANTE]: '#94a3b8',
  [TicketStatusEnum.AGUARDANDO_RESPOSTA]: '#fb923c',
  [TicketStatusEnum.RESOLVIDO]: '#22c55e',
  [TicketStatusEnum.FECHADO]: '#0d9488',
  [TicketStatusEnum.CANCELADO]: '#ef4444',
};

/**
 * Painel inicial - indicadores reais do módulo de Chamados de TI (ver PROJECT_SPEC.md). Só chama
 * GET /bff/v1/tickets/dashboard se o usuário tiver CHAMADO_CONSULT (TicketsPermissionPolicy.
 * canViewAll()) - quem só tem o papel SOLICITANTE não tem esse dado agregado (dashboard não
 * expõe nada de terceiros pra quem só vê os próprios chamados), e vê um card de boas-vindas
 * simples em vez dos gráficos.
 */
@Component({
  standalone: true,
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  imports: [
    CsDatePipe,
    CardModule,
    ChartModule,
    ButtonModule,
    TranslateModule,
    PageHeaderComponent,
    StatusBadgeComponent,
  ],
})
export class DashboardComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly theme = inject(ThemeService);

  readonly i18n = inject(I18nService);
  readonly facade = inject(TicketsDashboardFacade);
  readonly policy = inject(TicketsPermissionPolicy);

  readonly canViewDashboard = computed(() => this.policy.canViewAll());

  readonly tone = ticketStatusTone;

  ngOnInit(): void {
    if (this.canViewDashboard()) {
      this.facade.load();
    }
  }

  statusLabel(status: string): string {
    return this.i18n.tUi(`tickets.status.${status}` as never);
  }

  goDetail(id: string): void {
    void this.router.navigate(['/tickets', id]);
  }

  goTickets(): void {
    void this.router.navigate(['/tickets']);
  }

  private cssVar(name: string, fallback: string): string {
    if (typeof window === 'undefined') return fallback;
    const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return value || fallback;
  }

  private readonly textColor = computed(() => {
    const dark = this.theme.mode() === 'dark';
    return this.cssVar('--text-color-secondary', dark ? '#a1a1aa' : '#57534e');
  });

  private readonly gridColor = computed(() =>
    this.theme.mode() === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
  );

  private readonly primaryColor = computed(() => this.cssVar('--primary-color', '#0d9488'));

  readonly totalTickets = computed(() =>
    (this.facade.data()?.porStatus ?? []).reduce((sum, item) => sum + (item.count ?? 0), 0),
  );

  readonly statusChartData = computed(() => {
    this.i18n.getAppliedLang();
    const items = this.facade.data()?.porStatus ?? [];

    return {
      labels: items.map((item) => this.statusLabel(item.status)),
      datasets: [
        {
          data: items.map((item) => item.count),
          backgroundColor: items.map((item) => STATUS_COLORS[item.status as TicketStatusEnum] ?? '#94a3b8'),
          borderWidth: 0,
        },
      ],
    };
  });

  readonly statusChartOptions = computed(() => {
    const text = this.textColor();
    return {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%',
      plugins: {
        legend: { position: 'bottom' as const, labels: { color: text } },
      },
    };
  });

  readonly categoryChartData = computed(() => {
    const items = this.facade.data()?.porCategoria ?? [];
    const color = this.primaryColor();

    return {
      labels: items.map((item) => item.categoriaNome),
      datasets: [{ data: items.map((item) => item.count), backgroundColor: color, borderRadius: 4, maxBarThickness: 40 }],
    };
  });

  readonly categoryChartOptions = computed(() => {
    const text = this.textColor();
    const grid = this.gridColor();

    return {
      indexAxis: 'y' as const,
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: text, precision: 0 }, grid: { color: grid } },
        y: { ticks: { color: text }, grid: { display: false } },
      },
    };
  });
}
