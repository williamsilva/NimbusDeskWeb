import { effect, untracked, Signal } from '@angular/core';
import { FormControl } from '@angular/forms';

import { SelectOption } from '@models/select-option.model';

interface AutoSelectField<T> {
  readonly options: Signal<SelectOption<T>[]>;
  readonly control: FormControl<T | null>;
}

/**
 * Telas de cadastro (2026-09-09): quando um {@code p-select} tem exatamente 1 opção disponível,
 * ela já deve vir pré-selecionada - evita um clique óbvio quando não existe escolha real (ex.: só
 * há 1 SLA/Categoria/Setor cadastrado). NUNCA sobrescreve um valor já presente no controle - nem o
 * escolhido pelo usuário, nem o de um registro existente sendo editado (só age quando
 * {@code control.value == null}).
 *
 * Uso: chamar em campo de classe, DEPOIS de {@code form}/{@code editForm} já estar declarado -
 * `private readonly autoSelect = autoSelectSingleOption([{ options: this.slaOptions, control:
 * this.form.controls.slaId }]);` - e então chamar `this.autoSelect.applyNow()` de forma síncrona
 * logo depois de resetar o formulário (cobre o caso comum de options já carregadas em cache de uma
 * abertura anterior do diálogo/página). Se a chamada acontecer de dentro de outro {@code effect()},
 * envolver em {@code untracked()} - senão as options viram dependência TAMBÉM daquele effect
 * externo, e ele passa a re-rodar (e re-resetar o formulário) toda vez que a lista carregar/mudar.
 *
 * O {@code effect()} criado aqui cobre o caso de 1ª carga assíncrona (options ainda vazias no
 * momento do reset, chegam via HTTP um instante depois) - só reage à mudança nas próprias listas de
 * opções, nunca toca no resto do formulário.
 */
export function autoSelectSingleOption<T>(fields: AutoSelectField<T>[]): { applyNow: () => void } {
  const applyNow = (): void => {
    for (const field of fields) {
      const opts = field.options();
      if (opts.length === 1 && field.control.value == null) {
        field.control.setValue(opts[0]!.value);
      }
    }
  };

  effect(() => {
    fields.forEach((field) => field.options());
    untracked(applyNow);
  });

  return { applyNow };
}
