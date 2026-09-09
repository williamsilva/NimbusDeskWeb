import { FormsModule } from '@angular/forms';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { Component, forwardRef, input } from '@angular/core';

import { EditorModule } from 'primeng/editor';

/**
 * Editor de texto rico (Quill, via {@code p-editor} do PrimeNG) com toolbar CUSTOMIZADA -
 * reaproveitado nos 3 lugares que ganharam rich text em 2026-09-08 (comentário de chamado,
 * descrição na abertura e na edição). Primeiro uso de rich text no ecossistema Nimbus, sem
 * precedente em nenhum outro produto nem lib compartilhada.
 *
 * <p><b>Por que um wrapper, e não {@code <p-editor [modules]="...">} direto</b>: o {@code p-editor}
 * SEMPRE renderiza sua própria toolbar padrão embutida (título/FONTE/negrito/itálico/sublinhado/
 * cor/destaque/lista/alinhamento/link/imagem/bloco de código/limpar) a menos que receba um
 * {@code <p-header>} projetado - passar {@code [modules]="{toolbar: [...]}"} como array NÃO
 * substitui essa toolbar padrão, faz o Quill criar uma SEGUNDA toolbar à parte (achado real: as
 * duas apareciam empilhadas e sem estilo nenhum). A forma suportada de customizar é projetar o
 * HTML da toolbar via {@code <p-header>} com os botões/selects `ql-*` que eu quiser (Quill lê essa
 * marcação em vez de gerar uma nova) - ver createQuillEditor() em primeng/editor: só usa
 * `modules.toolbar` como array quando NENHUM `<p-header>` foi projetado.
 *
 * <p>Precisa do CSS do tema "snow" do Quill importado globalmente (ver styles.scss) - sem ele os
 * botões/selects aparecem sem ícone, com `<select>` cru do navegador.
 */
@Component({
  standalone: true,
  selector: 'app-rich-text-editor',
  imports: [FormsModule, EditorModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RichTextEditorComponent),
      multi: true,
    },
  ],
  template: `
    <p-editor
      [style]="{ height: height() }"
      [placeholder]="placeholder()"
      [readonly]="disabled"
      [ngModel]="value"
      (ngModelChange)="onModelChange($event)"
      (onBlur)="onTouched()"
    >
      <p-header>
        <span class="ql-formats">
          <select class="ql-header">
            <option value="1">Heading 1</option>
            <option value="2">Heading 2</option>
            <option value="3">Heading 3</option>
            <option selected>Normal</option>
          </select>
        </span>
        <span class="ql-formats">
          <button class="ql-bold" type="button" aria-label="Bold"></button>
          <button class="ql-italic" type="button" aria-label="Italic"></button>
          <button class="ql-underline" type="button" aria-label="Underline"></button>
          <button class="ql-strike" type="button" aria-label="Strike"></button>
        </span>
        <span class="ql-formats">
          <select class="ql-color"></select>
          <select class="ql-background"></select>
        </span>
        <span class="ql-formats">
          <button class="ql-list" value="ordered" type="button" aria-label="Ordered list"></button>
          <button class="ql-list" value="bullet" type="button" aria-label="Bullet list"></button>
          <select class="ql-align">
            <option selected></option>
            <option value="center">center</option>
            <option value="right">right</option>
            <option value="justify">justify</option>
          </select>
        </span>
        <span class="ql-formats">
          <button class="ql-link" type="button" aria-label="Link"></button>
          <button class="ql-image" type="button" aria-label="Image"></button>
        </span>
        <span class="ql-formats">
          <button class="ql-clean" type="button" aria-label="Remove formatting"></button>
        </span>
      </p-header>
    </p-editor>
  `,
})
export class RichTextEditorComponent implements ControlValueAccessor {
  readonly height = input('180px');
  readonly placeholder = input('');

  value: string | null = null;
  disabled = false;

  private onChange: (value: string | null) => void = () => undefined;
  onTouched: () => void = () => undefined;

  writeValue(value: string | null): void {
    this.value = value;
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onModelChange(value: string | null): void {
    this.value = value;
    this.onChange(value);
  }
}
