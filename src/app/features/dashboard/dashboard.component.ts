import { Component } from '@angular/core';

import { CardModule } from 'primeng/card';
import { TranslateModule } from '@ngx-translate/core';

import { PageHeaderComponent } from '@shared/features/page-header/page-header.component';

/** Painel inicial - base mínima do NimbusDesk (produto novo, ainda sem nenhum módulo de negócio).
 *  Stub vazio de propósito: sem gráficos, sem chamada HTTP, sem facade - só um placeholder até o
 *  primeiro módulo de negócio existir e definir o que faz sentido mostrar aqui. */
@Component({
  standalone: true,
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  imports: [CardModule, TranslateModule, PageHeaderComponent],
})
export class DashboardComponent {}
