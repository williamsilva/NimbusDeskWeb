import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { map } from 'rxjs/operators';

import { API } from '@core/api/api.config';
import {
  TicketAutomationSettingsApiModel,
  TicketAutomationSettingsModel,
  TicketAutomationSettingsUpsertInput,
  mapTicketAutomationSettingsApiModel,
} from '@models/ticket-automation-settings.models';

/** Configurações > Automação de chamados - linha única, sem paginação (mesmo padrão de
 *  EmailSettingsApiService/SlaApiService). */
@Injectable({ providedIn: 'root' })
export class TicketAutomationSettingsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API.bff}/v1/ticket-automation/settings`;

  getSettings() {
    return this.http
      .get<TicketAutomationSettingsApiModel>(this.baseUrl)
      .pipe(map(mapTicketAutomationSettingsApiModel));
  }

  updateSettings(input: TicketAutomationSettingsUpsertInput) {
    return this.http
      .put<TicketAutomationSettingsApiModel>(this.baseUrl, input)
      .pipe(map((res): TicketAutomationSettingsModel => mapTicketAutomationSettingsApiModel(res)));
  }
}
