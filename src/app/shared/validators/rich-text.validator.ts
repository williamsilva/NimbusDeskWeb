import { AbstractControl, ValidationErrors } from '@angular/forms';

/** Quill (ver PrimeNG p-editor) nunca escreve string vazia num campo "sem conteúdo" - escreve
 *  {@code <p><br></p>} (ou variações com {@code &nbsp;}), então {@code Validators.required} sozinho
 *  nunca dispara pra um editor rico deixado em branco (a string em si não é vazia, só o texto
 *  visível é). Remove tags/`&nbsp;` e testa o texto puro que sobra - retorna o MESMO formato de
 *  erro do Validators.required nativo ({@code {required: true}}) pra reaproveitar o mapeamento já
 *  existente em ErrorMsgComponent/normalizeAngularErrorKey, sem precisar de chave i18n nova. Já é
 *  um ValidatorFn válido (mesma assinatura) - usar direto em {@code [richTextRequired, ...]}. */
export function richTextRequired(control: AbstractControl): ValidationErrors | null {
  const value = (control.value as string | null) ?? '';
  const stripped = value
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .trim();
  return stripped.length > 0 ? null : { required: true };
}
